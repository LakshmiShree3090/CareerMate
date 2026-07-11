from os import getenv

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

client = MongoClient(getenv("MONGO_URI"))
db = client["careermate"]
