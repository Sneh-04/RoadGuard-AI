import requests
import numpy as np

url = "http://127.0.0.1:8000/predict"

data = np.random.rand(100,3).tolist()

response = requests.post(url, json={"data": data})
print(response.json())
