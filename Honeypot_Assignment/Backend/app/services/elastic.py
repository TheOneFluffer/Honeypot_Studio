from elasticsearch import Elasticsearch

def get_elastic_client():
    es = Elasticsearch("http://localhost:9200")
    return es
