from llama_index.llms.openai import OpenAI
from llama_index.core.llms import ChatMessage
from llama_index.core import SimpleDirectoryReader
from llama_index.readers.file import PyMuPDFReader
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.core.node_parser import SentenceSplitter
from llama_index.llms.openai import OpenAI
from llama_index.core import Settings
from llama_index.core import VectorStoreIndex
from llama_index.core.node_parser import SimpleNodeParser
from llama_index.core import VectorStoreIndex, get_response_synthesizer
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.core.query_engine import RetrieverQueryEngine

from pathlib import Path
from IPython.display import display, HTML

import os
import openai

from Provider.LLM_Provider import get_response_with_or_without_references


def ReadClientFiles(clientFileLocation):
    reader = SimpleDirectoryReader(Path(clientFileLocation))
    print("ReadClientFiles: Step 1")
    documents = reader.load_data()

    print("ReadClientFiles: Step 2")
    return documents

def  ConstructQueryEngine(documents):
    ##Initialize the OpenAI model
    print("ConstructQueryEngine: Step 1")
    Settings.llm = OpenAI(model="gpt-3.5-turbo", temperature=0, max_tokens=256)

    ##Initialize the embedding model
    Settings.embed_model = OpenAIEmbedding()

    ## Initialize the node_parser with the custom node settings
    Settings.node_parser = SentenceSplitter(chunk_size=500, chunk_overlap=50)
    print("ConstructQueryEngine: Step 2")
    ## Initialize the num_output and the context window
    Settings.num_output = 500
    Settings.context_window = 3900
    
    print("ConstructQueryEngine: Step 3")
    # Create a VectorStoreIndex from a list of documents using the service context
    
    index = VectorStoreIndex.from_documents(documents)

    retriever = VectorIndexRetriever(
    index=index,
    similarity_top_k=3,
    )

    # configure response synthesizer - refine mode as this is QA system
    response_synthesizer = get_response_synthesizer(
        response_mode="refine",
    )

    print("ConstructQueryEngine: Step 4")
    # assemble query engine
    query_engine = RetrieverQueryEngine(
        retriever=retriever,
        response_synthesizer=response_synthesizer,
    )
    return query_engine

def GetResponse(query_engine, user_input):
    print("GetResponse: Step 1")
    response = query_engine.query(user_input)

    citation_required=get_response_with_or_without_references(user_input,response.response)
    print("GetResponse: Step 2:citation_required")
    return create_html_response(response.response,response.source_nodes,citation_required)



def create_html_response(chat_response, source_nodes,citation_required):
    
    
    # Start with the chat response
    html = f"<p>{chat_response}</p>"
    
    # Add the references section
    if citation_required == "YES":
        info_list = extract_file_info(source_nodes)
        if info_list:
            html += "<p><u>References:<u></p>"
            html += "<ul>"
            for info in info_list:
                html += f"<li>File Name: {info['File Name']}, Page No: {info['Page No']}</li>"
            html += "</ul>"
    
    return html

def extract_file_info(source_nodes):
    info_list = []
    if not source_nodes:
        return info_list
    for node in source_nodes:
        file_name = node.metadata.get('file_name', 'Unknown')
        page_label = node.metadata.get('page_label', 'Unknown')
        info_list.append({'File Name': file_name, 'Page No': page_label})
    return info_list
