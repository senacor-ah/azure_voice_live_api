#!/usr/bin/env python3
"""
RAG Benchmark Script

Vergleicht Azure OpenAI und OpenRouter für RAG-Anfragen.
Testet beide Varianten mit den gleichen Fragen und misst detaillierte Timing-Daten.
"""

import os
import sys
import time
import logging
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Setup paths
backend_dir = Path(__file__).parent.parent  # backend/ (one level up from rag_benchmark/)
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path)

# Add RAG src to path
rag_src_path = backend_dir / "RAG" / "src"
if str(rag_src_path) not in sys.path:
    sys.path.append(str(rag_src_path))

# Import RAG components
from blob_storage import BlobStorageManager
from embeddings import EmbeddingManager
from vector_search import VectorSearchManager
from answer_generator import AnswerGenerator
from answer_generator_openrouter import AnswerGeneratorOpenRouter

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Test questions
QUESTIONS = [
    "Welche Arten von Kreditkarten gibt es?",
    "Welche Arten von Bankkonten gibt es?",
    "Was ist ein Dauerauftrag?",
    "Welche Sorten von Edelmetalle gibt es?",
    "Was ist ein klassik depot?"
]


class RAGBenchmark:
    """RAG Benchmark Runner"""
    
    def __init__(self):
        self.blob_manager = BlobStorageManager()
        self.embedding_manager = EmbeddingManager()
        self.search_manager = VectorSearchManager()
        self.azure_generator = AnswerGenerator()
        self.openrouter_generator = AnswerGeneratorOpenRouter()
        self.results = []
        
    def initialize(self):
        """Initialize all components"""
        logger.info("Initializing RAG components...")
        
        if not self.blob_manager.initialize():
            logger.error("Failed to initialize blob storage")
            return False
        
        if not self.embedding_manager.initialize():
            logger.error("Failed to initialize embeddings")
            return False
        
        if not self.search_manager.initialize():
            logger.error("Failed to initialize vector search")
            return False
        
        if not self.azure_generator.initialize():
            logger.error("Failed to initialize Azure OpenAI generator")
            return False
        
        if not self.openrouter_generator.initialize():
            logger.error("Failed to initialize OpenRouter generator")
            return False
        
        logger.info("✅ All components initialized successfully")
        return True
    
    def run_query(self, question, generator, generator_name, top_k=5):
        """Run a single query and collect timing data"""
        result = {
            "generator": generator_name,
            "question": question,
            "timings": {},
            "sources": [],
            "answer": None,
            "error": None
        }
        
        try:
            # Step 1: Generate embedding
            start_time = time.time()
            query_embedding = self.embedding_manager.generate_embedding(question)
            result["timings"]["embedding"] = time.time() - start_time
            
            if query_embedding is None:
                result["error"] = "Failed to generate embedding"
                return result
            
            # Step 2: Vector search
            start_time = time.time()
            search_results = self.search_manager.vector_search(query_embedding, top_k=top_k)
            result["timings"]["search"] = time.time() - start_time
            result["timings"]["chunks_found"] = len(search_results) if search_results else 0
            
            if not search_results:
                result["error"] = "No relevant documents found"
                return result
            
            # Store source information
            result["sources"] = [
                {
                    "source": doc.get("source", "Unknown"),
                    "score": doc.get("score", 0),
                    "content_preview": doc.get("content", "")[:200] + "..."
                }
                for doc in search_results
            ]
            
            # Step 3: Generate answer with detailed timing
            answer_result = generator.generate_answer(
                question=question,
                context_documents=search_results,
                max_tokens=1000
            )
            
            if answer_result is None:
                result["error"] = "Failed to generate answer"
                return result
            
            # Extract timing data from result
            if isinstance(answer_result, dict):
                result["answer"] = answer_result.get("answer")
                result["timings"]["llm_first_token"] = answer_result.get("first_token_time", 0)
                result["timings"]["llm_generation_total"] = answer_result.get("total_time", 0)
                result["timings"]["token_count"] = answer_result.get("token_count", 0)
            else:
                # Fallback for old format (just string)
                result["answer"] = answer_result
                result["timings"]["llm_generation_total"] = 0
                result["timings"]["llm_first_token"] = 0
            
        except Exception as e:
            logger.error(f"Error in query for {generator_name}: {e}")
            result["error"] = str(e)
        
        return result
    
    def run_benchmark(self):
        """Run benchmark for all questions with both generators"""
        logger.info(f"Starting benchmark with {len(QUESTIONS)} questions...")
        
        for i, question in enumerate(QUESTIONS, 1):
            logger.info(f"\n{'='*80}")
            logger.info(f"Question {i}/{len(QUESTIONS)}: {question}")
            logger.info(f"{'='*80}")
            
            # Test with Azure OpenAI
            logger.info("🔵 Testing with Azure OpenAI...")
            azure_result = self.run_query(question, self.azure_generator, "Azure OpenAI")
            self.results.append(azure_result)
            
            # Test with OpenRouter
            logger.info("🟠 Testing with OpenRouter...")
            openrouter_result = self.run_query(question, self.openrouter_generator, "OpenRouter")
            self.results.append(openrouter_result)
            
            logger.info("✅ Question completed")
        
        logger.info(f"\n{'='*80}")
        logger.info("Benchmark completed!")
        logger.info(f"{'='*80}")
    
    def generate_markdown_report(self, output_file="output_rag.md"):
        """Generate markdown report with all results"""
        logger.info(f"Generating markdown report: {output_file}")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            # Header
            f.write("# RAG Benchmark Report\n\n")
            f.write(f"**Datum:** {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}\n\n")
            f.write(f"**Anzahl Fragen:** {len(QUESTIONS)}\n\n")
            f.write(f"**Generatoren:** Azure OpenAI vs. OpenRouter\n\n")
            f.write("---\n\n")
            
            # Results for each question
            for i, question in enumerate(QUESTIONS, 1):
                f.write(f"## Frage {i}: {question}\n\n")
                
                # Get results for this question (Azure and OpenRouter)
                azure_result = self.results[(i-1)*2]  # Even indices
                openrouter_result = self.results[(i-1)*2 + 1]  # Odd indices
                
                # Comparison table
                f.write("### Timing-Vergleich\n\n")
                f.write("| Metrik | Azure OpenAI | OpenRouter |\n")
                f.write("|--------|--------------|------------|\n")
                
                # Embedding time
                azure_emb = azure_result["timings"].get("embedding", 0)
                or_emb = openrouter_result["timings"].get("embedding", 0)
                f.write(f"| Embedding Generation | {azure_emb:.3f}s | {or_emb:.3f}s |\n")
                
                # Search time
                azure_search = azure_result["timings"].get("search", 0)
                or_search = openrouter_result["timings"].get("search", 0)
                f.write(f"| Vector Search | {azure_search:.3f}s | {or_search:.3f}s |\n")
                
                # Chunks found
                azure_chunks = azure_result["timings"].get("chunks_found", 0)
                or_chunks = openrouter_result["timings"].get("chunks_found", 0)
                f.write(f"| Chunks gefunden | {azure_chunks} | {or_chunks} |\n")
                
                # LLM generation - First Token
                azure_first = azure_result["timings"].get("llm_first_token", 0)
                or_first = openrouter_result["timings"].get("llm_first_token", 0)
                if azure_first and or_first:
                    f.write(f"| LLM First Token | {azure_first:.3f}s | {or_first:.3f}s |\n")
                
                # LLM generation - Total
                azure_llm = azure_result["timings"].get("llm_generation_total", 0)
                or_llm = openrouter_result["timings"].get("llm_generation_total", 0)
                f.write(f"| LLM Generation (Total) | {azure_llm:.3f}s | {or_llm:.3f}s |\n")
                
                # Token count
                azure_tokens = azure_result["timings"].get("token_count", 0)
                or_tokens = openrouter_result["timings"].get("token_count", 0)
                f.write(f"| Tokens generiert | {azure_tokens} | {or_tokens} |\n")
                
                # Total time
                azure_total = azure_emb + azure_search + azure_llm
                or_total = or_emb + or_search + or_llm
                f.write(f"| **Gesamt** | **{azure_total:.3f}s** | **{or_total:.3f}s** |\n\n")
                
                # Azure OpenAI Results
                f.write("### 🔵 Azure OpenAI Ergebnis\n\n")
                if azure_result["error"]:
                    f.write(f"**Fehler:** {azure_result['error']}\n\n")
                else:
                    f.write("#### Antwort\n\n")
                    f.write(f"{azure_result['answer']}\n\n")
                
                # OpenRouter Results
                f.write("### 🟠 OpenRouter Ergebnis\n\n")
                if openrouter_result["error"]:
                    f.write(f"**Fehler:** {openrouter_result['error']}\n\n")
                else:
                    f.write("#### Antwort\n\n")
                    f.write(f"{openrouter_result['answer']}\n\n")
                
                f.write("---\n\n")
            
            # Summary statistics
            f.write("## Zusammenfassung\n\n")
            
            # Calculate average times
            azure_results = [r for r in self.results if r["generator"] == "Azure OpenAI"]
            or_results = [r for r in self.results if r["generator"] == "OpenRouter"]
            
            # Average first token time
            azure_avg_first = sum(r["timings"].get("llm_first_token", 0) for r in azure_results if r["timings"].get("llm_first_token")) / len(azure_results)
            or_avg_first = sum(r["timings"].get("llm_first_token", 0) for r in or_results if r["timings"].get("llm_first_token")) / len(or_results)
            
            # Average LLM generation total
            azure_avg_llm = sum(r["timings"].get("llm_generation_total", 0) for r in azure_results) / len(azure_results)
            or_avg_llm = sum(r["timings"].get("llm_generation_total", 0) for r in or_results) / len(or_results)
            
            # Average total time
            azure_avg_total = sum(
                r["timings"].get("embedding", 0) + 
                r["timings"].get("search", 0) + 
                r["timings"].get("llm_generation_total", 0) 
                for r in azure_results
            ) / len(azure_results)
            
            or_avg_total = sum(
                r["timings"].get("embedding", 0) + 
                r["timings"].get("search", 0) + 
                r["timings"].get("llm_generation_total", 0) 
                for r in or_results
            ) / len(or_results)
            
            f.write("### Durchschnittliche Zeiten\n\n")
            f.write("| Metrik | Azure OpenAI | OpenRouter |\n")
            f.write("|--------|--------------|------------|\n")
            f.write(f"| Durchschn. First Token | {azure_avg_first:.3f}s | {or_avg_first:.3f}s |\n")
            f.write(f"| Durchschn. LLM Generation | {azure_avg_llm:.3f}s | {or_avg_llm:.3f}s |\n")
            f.write(f"| Durchschn. Gesamtzeit | {azure_avg_total:.3f}s | {or_avg_total:.3f}s |\n")
            
            # Determine winner
            if or_avg_total < azure_avg_total:
                winner = "OpenRouter"
                diff = azure_avg_total - or_avg_total
                f.write(f"\n**Schneller:** 🟠 OpenRouter (um {diff:.3f}s schneller)\n")
            else:
                winner = "Azure OpenAI"
                diff = or_avg_total - azure_avg_total
                f.write(f"\n**Schneller:** 🔵 Azure OpenAI (um {diff:.3f}s schneller)\n")
        
        logger.info(f"✅ Report saved to: {output_file}")


def main():
    """Main function"""
    logger.info("="*80)
    logger.info("RAG Benchmark - Azure OpenAI vs. OpenRouter")
    logger.info("="*80)
    
    benchmark = RAGBenchmark()
    
    # Initialize
    if not benchmark.initialize():
        logger.error("Failed to initialize benchmark")
        sys.exit(1)
    
    # Run benchmark
    benchmark.run_benchmark()
    
    # Generate report
    output_path = Path(__file__).parent / "output_rag.md"
    benchmark.generate_markdown_report(str(output_path))
    
    logger.info(f"\n✅ Benchmark completed! Report saved to: {output_path}")


if __name__ == "__main__":
    main()
