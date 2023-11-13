import chromadb
import uuid
import chars2vec
from time import time

model = chars2vec.load_model('eng_150')

chroma_client = chromadb.PersistentClient(path='./chroma')
collection = chroma_client.create_collection(name="eng_150_most_used_words")

path = '40k-words.txt'
file = open(path, 'r')

time_started = time()
words = []
for (index, line) in enumerate(file):
    no_newline = line.split('\n')[0]
    words.append(no_newline)

start = time()
embeddings = model.vectorize_words(words).tolist()
ids = [str(uuid.uuid4()) for _ in range(len(words))]
metadatas = [{"source": word} for word in words]
end = time()

print('Time taken to extract info', end - start)

start = time()

values = []
for i in range(len(words)//5460 + 1):
    value = {}
    value['words'] = words[i*5460:(i+1)*5460]
    value['metadatas'] = metadatas[i*5460:(i+1)*5460]
    value['ids'] = ids[i*5460:(i+1)*5460]
    value['embeddings'] = embeddings[i*5460:(i+1)*5460]
    values.append(value)

for value in values:
    print('ADding to chroma')
    collection.add(documents=value['words'], metadatas=value['metadatas'],
                   ids=value['ids'], embeddings=value['embeddings'])

end = time()

print('Time taken to add to chroma', end - start)
