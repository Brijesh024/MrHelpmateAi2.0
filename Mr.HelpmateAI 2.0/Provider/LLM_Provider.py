from openai import OpenAI
client = OpenAI()

def initialize_conversation():
    
    conversation = [{"role": "system", "content": "Hi there, I'm here to help you find information, answer any questions. Feel free to ask me anything or let me know how I can assist you today?" }]
    return conversation


def get_response_with_or_without_references(query,response):
    
    messages = [
                {"role": "system", "content":  "You are an expert RAG system evaluator, whose job is to verify if References or citation need to be attached or not based on the given respnse data. Analyse the response if it seems the answer was found give YES else NO"},
                {"role": "user", "content": f"""Answer with only YES/NO. You are given a LLM response from RAG system based on user query.
                Validate the query '{query}' and RAG system response :'{response}' to determine whether the References need to be attached or not.
                You must answer "NO" if response does not have users query response."""},
              ]

    result = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages
    )
    print(query,response)
    print(result.choices[0].message.content)
    return result.choices[0].message.content

#Test the function
#get_response_with_or_without_references("what is revenue of uber in 2021","Uber's revenue for the year 2021 was $17.455 billion.")
#get_response_with_or_without_references("what is revenue of india","No data found in current context.")