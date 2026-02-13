import os
import time
import logging
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class AnswerGenerator:
    def __init__(self):
        self.api_key = os.getenv("AZURE_OPENAI_API_KEY")
        self.api_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        self.api_version = os.getenv("AZURE_OPENAI_API_VERSION")
        self.deployment_name = os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT")
        self.client = None
        self.system_prompt = """You are a helpful assistant that answers questions based on provided context.
Always use the provided context to answer questions accurately.
If the context doesn't contain enough information, say so clearly.
Keep answers concise and well-structured.
Format your answer in a clear, readable way."""

    def initialize(self):
        """Initialize Azure OpenAI chat model."""
        try:
            self.client = AzureOpenAI(
                api_key=self.api_key,
                api_version=self.api_version,
                azure_endpoint=self.api_endpoint
            )
            logger.info(f"Chat model '{self.deployment_name}' initialized.")
            return True
        except Exception as e:
            logger.error(f"Error initializing chat model: {e}")
            return False

    def set_system_prompt(self, prompt):
        """Set custom system prompt."""
        self.system_prompt = prompt

    def generate_answer(self, question, context_documents, max_tokens=1000):
        """Generate an answer based on retrieved documents."""
        try:
            # Build context from documents
            context = self._build_context(context_documents)
            
            # Create messages
            messages = [
                {
                    "role": "system",
                    "content": self.system_prompt
                },
                {
                    "role": "user",
                    "content": f"""Based on the following context, answer the question.

CONTEXT:
{context}

QUESTION:
{question}

ANSWER:"""
                }
            ]
            
            # Generate response with streaming for accurate timing
            start_time = time.time()
            first_byte_time = None
            full_response = ""
            token_count = 0
            
            # Stream the response to capture first token timing
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=messages,
                max_completion_tokens=max_tokens,
                stream=True
            )
            
            for chunk in response:
                # Check if chunk has choices and content
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if delta.content is not None:
                        # Record time of first token
                        if first_byte_time is None:
                            first_byte_time = time.time() - start_time
                        
                        # Accumulate the response
                        full_response += delta.content
                        token_count += 1
            
            total_time = time.time() - start_time
            
            # Log timing only if we got content
            if first_byte_time is not None:
                logger.info(f"[TIMING] LLM generation: First token in {first_byte_time:.2f}s, All tokens in {total_time:.2f}s ({token_count} tokens)")
            else:
                logger.warning(f"[TIMING] LLM generation: No tokens received in {total_time:.2f}s")
            
            return full_response.strip()
        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            return None

    def _build_context(self, documents):
        """Build context string from retrieved documents."""
        context_parts = []
        for i, doc in enumerate(documents, 1):
            context_parts.append(f"[Source {i}: {doc['source']}]\n{doc['content']}\n")
        return "\n".join(context_parts) if context_parts else "No relevant context found."
