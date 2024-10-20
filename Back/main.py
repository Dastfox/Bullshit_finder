import json

from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}


@app.get("/word/{name}")
async def get_word(name: str):
    list_of_dict_db = get_json_as_dict()
    for dict_db in list_of_dict_db:
        print(dict_db)
        if dict_db["name"] == name:
            print("Found")
            return {"word": dict_db}
    return {"word": "Not found"}

@app.get("/word_list")
async def get_word_list():
    list_of_dict_db = get_json_as_dict()
    word_list = []
    for dict_db in list_of_dict_db:
        word_list.append(dict_db["name"])
    return {"word_list": word_list}

def get_json_as_dict():
    with open('mock.json') as f:
        data = json.load(f)
    return data
