from flask import Flask, jsonify, redirect, url_for, render_template, request, session, Response
from types import SimpleNamespace
from Provider.LLM_Provider import initialize_conversation
from werkzeug.utils import secure_filename

import uuid
import time
import openai
import pandas as pd
import json
import os

from Provider.Llama_Provider import ConstructQueryEngine, GetResponse, ReadClientFiles



# Global variables
filePath=os.getcwd()+"\\uploads\\"
# chroma_data_path="C:\\uploads\\chroma.db"
# embeddingModel = "text-embedding-ada-002"
# crossEncoderModel="cross-encoder/ms-marco-MiniLM-L-6-v2"
apiKeyFilePath="\\OpenAI_API_Key.txt"

app = Flask(__name__)

app.secret_key = os.urandom(24)
clients = {}

conversation_bot = []
conversation = []
introduction = ""
top_3_Result = []

#Error handling
@app.errorhandler(500)
def internal_error(error):
    print(error)  # For debugging, print the error to the console.
    return jsonify({
        'exit': '2', 
        'data': "The requested resource was not found.",
        'error': str(error) 
    }), 500

@app.errorhandler(404)
def not_found_error(error):
    # Log the error and/or extract information from it
    print(error)  # For debugging, print the error to the console.
    return jsonify({
        'exit': '2', 
        'data': "The requested resource was not found.",
        'error': str(error) 
    }), 404

@app.errorhandler(405)
def method_not_allowed_error(error):
    # Log the error and/or extract information from it
    print(error)  # For debugging, print the error to the console.
    return jsonify({
        'exit': '2', 
        'data': "The method is not allowed for the requested URL.",
        'error': str(error) 
    }), 405
 

def initialiseGlobalVariables(client_id):    
    global conversation_bot, conversation, top_3_Result,introduction
    with open(apiKeyFilePath) as f:
        apiData = f.readline()
        openai.api_key = apiData.strip()
        if not openai.api_key:
            raise ValueError("API Key is not loaded properly.")
   
    conversation_bot = []
    conversation = initialize_conversation()
    response_intro= conversation
    introduction = response_intro[0]["content"]
    conversation_bot.append({'bot':introduction})
    top_3_Result = []
    if client_id  in clients:
        clients[client_id] = SimpleNamespace(
                    conversation_bot=[],
                    conversation=conversation,
                    introduction=response_intro[0]["content"],
                    responseData=[],
                    query_engine=None
                )
    

def RemoveCurrentSessionFiles(client_id):
    user_folder =  os.path.join("SessionData", str(client_id))   
    if os.path.exists(user_folder):
        for file in os.listdir(user_folder):
            file_path = os.path.join(user_folder, file)
            try:
                if os.path.isfile(file_path):
                    os.unlink(file_path)
            except Exception as e:
                print(f"Error deleting file: {file_path} - {str(e)}")
        try:
            os.rmdir(user_folder)
        except Exception as e:
            print(f"Error removing directory: {user_folder} - {str(e)}")
        #remove from session and clients too
        session.pop(client_id, None)
        clients.pop(client_id, None)

@app.route('/get_client_id', methods = ['POST','GET'])
def get_client_id():    
    client_id =str(uuid.uuid4())  # Generate a new UUID
    session['client_id'] = client_id

    if client_id not in clients:
            clients[client_id] = SimpleNamespace(
                conversation_bot=[],
                conversation=initialize_conversation(),
                introduction="",
                responseData=[],
                query_engine=None
            )
    else:
        # If client_id exists in session, ensure it's also in clients dictionary
        client_id = session['client_id']
        if client_id not in clients:
            clients[client_id] = SimpleNamespace(
                conversation_bot=[],
                conversation=initialize_conversation(),
                introduction="",
                responseData=[],
                query_engine=None
            )
    return {'client_id': client_id}

@app.route("/")
def default_func():
    return render_template("MrHelpmateV2.html")


@app.route("/restart_conv", methods = ['POST','GET'])
def end_conv():
    responseData={}
    global conversation_bot, conversation
    try:
        client_id = request.form.get('client_id')
        #delete current files
        RemoveCurrentSessionFiles(client_id)
        newClientId = get_client_id()
        responseData={'exit':'0','data':newClientId['client_id']}
    except Exception as e:
        responseData={'exit':'2','data':f"An error occurred: {str(e)}"}
        print(f"An error occurred: {str(e)}")
    return responseData
##Step 1: Upload files
@app.route('/uploadfiles', methods=['POST'])
def upload_file():
    # if 'files' not in request.files:
    #     flash('No files selected')
    #     return redirect(url_for('home'))
    print("Uploading files: Step 1")
    session_id = request.form.get('clientID')  # Ensure session is established
    user_folder = os.path.join("SessionData", str(session_id))    # Create a folder for the user session
    print(f"Uploading files for session: {session_id}")
    #create folder if not exists
    if not os.path.exists(user_folder):
        os.makedirs(user_folder)

    uploaded_files = request.files.getlist('files')  # Retrieve multiple files
    successful_uploads = []
    failed_uploads = []

    for file in uploaded_files:
        print("Uploading files: Step 2")
        filename = secure_filename(file.filename)
        filepath = os.path.join(user_folder, filename)
        try:
            print("Uploading files: Step 3")
            file.save(filepath)
            successful_uploads.append(filename)
            print("Uploading files: Step 4")
        except Exception as e:
            print(f"Error saving uploaded file: {filename} - {e}")
    print("Uploading files: Step 5")
    return successful_uploads

@app.route('/deletefile', methods=['POST'])
def delete_file():
    deleted='true'
    session_id = request.form.get('clientID')
    file_name = request.form.get('file_name')
    print("Deleting file: Step 1")    
    user_folder = os.path.join("SessionData", str(session_id))   
    print(f"Deleting file: {user_folder} for session: {session_id}")

    if not os.path.exists(user_folder):       
       return deleted, 200

    file_path = os.path.join(user_folder, file_name)
    try:
        print("Deleting file: Step 2")
        if os.path.isfile(file_path):
            os.unlink(file_path)
            deleted='true'
    except Exception as e:
        print(f"Error deleting file: {file_path} - {str(e)}")
        deleted='false'

    print("Deleting file: Step 3")
    return deleted, 200
##Step 2: Process files
@app.route('/processFiles', methods=['POST'])   
def processFiles():
    global oai_embedding_function,chromaDbClient,introduction
    try:
        client_id = request.form.get('clientID')
        print("Processing files: Step 1 ")
        print(f"Processing files for client: {client_id}")
        # Access and manipulate the client's data
        client_data = clients[client_id]

        user_folder = os.path.join("SessionData", str(client_id))   

        print("Processing files: Step 2 ")
        client_files = ReadClientFiles(user_folder)

        print("Processing files: Step 3 ")
        initialiseGlobalVariables(client_id)

        if len(client_files) == 0:
            client_data.responseData.append({'exit':'1','data':'No file or empty PDFs found found to process.'})
            return client_data.responseData
        
        print("Processing files: Step 4 ")
        clients[client_id].query_engine = ConstructQueryEngine(client_files)

        print("Processing files: Step 5 ")
        client_data.responseData.append({'exit':'0','data':introduction,'conversation':client_data.conversation})
        
    except Exception as e:
        exceptionMessage = str(e)
        client_data.responseData.append({'exit':'2','data':f"An error occurred: {exceptionMessage}.",'conversation':client_data.conversation})
        print(f"An error occurred: {exceptionMessage}")
    print("Processing files: Step 6 ")
    return jsonify(client_data.responseData)
##Step 3: Process conversation
@app.route("/conversation", methods = ['POST'])
def invite():
    try:
        responseData=[]
        client_id = request.json.get('client_id')
        print("Conversation Step 1")    
        print(f"Processing conversation for client: {client_id}")
        if client_id not in clients:
            responseData.append({'exit':'1','data':'Invalid session, force exiting the conversation.'})
            return responseData
        #initialiseGlobalVariables(client_id)
        
        # Access and manipulate the client's data
        client_data = clients[client_id]
        
        user_input = request.json.get('user_input_message')
        
        client_data.conversation.append({"role": "user", "content": user_input})       
        
        print("Conversation Step 2")
        top1_LLMRespons = GetResponse(client_data.query_engine, user_input)        
        
        client_data.conversation.append({"role": "assistant", "content": top1_LLMRespons})          

        print("Conversation Step 3")        
        responseData.append({'exit':'0'
                                         ,'data':top1_LLMRespons
                                         ,'conversation':client_data.conversation
                                         })
        
    except Exception as e:
            exceptionMessage = str(e)
            client_data.conversation.append({"role": "assistant", "content": f"An error occurred: {exceptionMessage}."})         
            responseData.append({'exit':'2','data':f"An error occurred: {exceptionMessage}.",'conversation':client_data.conversation})            
            print(f"An error occurred: {exceptionMessage}")
    print("Conversation Step 4")
    print(responseData)
    return jsonify(responseData)









if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0" ,threaded=True)