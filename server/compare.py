from flask import Flask, jsonify, request
import chromadb
import uuid
import chars2vec
import time
from flask_cors import CORS, cross_origin


app = Flask(__name__)
CORS(app)
model = chars2vec.load_model('eng_150')
chroma_client = chromadb.PersistentClient(path='./chroma')
collection = chroma_client.get_collection(name="eng_150_most_used_words")

# load "40k-words.txt" into a list
words = []
with open('40k-words.txt') as f:
    for line in f:
        words.append(line.strip())

print(len(words))


@app.route('/process_word', methods=['GET'])
@cross_origin()
def process_word():
    word = request.args.get('word')

    start = time.time()

    emb = model.vectorize_words([word]).tolist()[0]
    results = collection.query(query_embeddings=[emb], n_results=10)
    end = time.time()

    time_taken = end - start

    print(word)
    print(results['distances'])
    print(results['metadatas'])

    response = {
        'time_taken': time_taken,
        'results': results,
    }

    return jsonify(response)


@app.route("/getWords", methods=['GET'])
@cross_origin()
def getWords():
    return words


if __name__ == '__main__':
    app.run(debug=True)
