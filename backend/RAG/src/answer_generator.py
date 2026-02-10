import os
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()


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
            print(f"Chat model '{self.deployment_name}' initialized.")
            return True
        except Exception as e:
            print(f"Error initializing chat model: {e}")
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
            
            # Generate response
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=messages,
                max_completion_tokens=max_tokens
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error generating answer: {e}")
            return None

    def _build_context(self, documents):
        """Build context string from retrieved documents."""
        context_parts = []
        for i, doc in enumerate(documents, 1):
            context_parts.append(f"[Source {i}: {doc['source']}]\n{doc['content']}\n")
        return "\n".join(context_parts) if context_parts else "No relevant context found."
