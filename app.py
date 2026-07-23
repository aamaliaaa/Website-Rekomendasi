from flask import Flask, render_template, request, jsonify
import json
import numpy as np

app = Flask(__name__)


import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(BASE_DIR, 'static', 'tempatmakan.json')

#LOAD DATA
with open(json_path, encoding='utf-8') as f:
    RESTAURANTS = json.load(f)


#CBF 
def to_binary(r):
    return [
        1 if r['type'] == 'indoor' else 0,
        1 if r['type'] == 'outdoor' else 0,
        1 if r['type'] == 'both' else 0,
        int(r['wifi']),
        int(r['ac']),
        int(r['musholla']),
        int(r['parkirMotor']),
        int(r['parkirMobil'])
    ]

def normalize(val, min_val, max_val):
    if max_val == min_val:
        return 0
    return (val - min_val) / (max_val - min_val)

def cosine(a, b):
    a = np.array(a)
    b = np.array(b)
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def get_minmax():
    ratings = [r['rating'] for r in RESTAURANTS]
    prices = [(r['priceMin'] + r['priceMax']) / 2 for r in RESTAURANTS]

    return {
        "minR": min(ratings),
        "maxR": max(ratings),
        "minP": min(prices),
        "maxP": max(prices)
    }

#ROUTES
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/main')
def main():
    return render_template('main.html')

@app.route('/recommend', methods=['POST'])
def recommend():
    pref = request.json
    sort = pref.get('sort')

    minmax = get_minmax()

    #AMBIL INPUT USER
    price_min = pref.get('priceMin', 0)
    price_max = pref.get('priceMax', 0)
    rating_user = pref.get('rating', 0)


    #HITUNG HARGA USER
    user_price = 0
    if price_min > 0 and price_max > 0:
        user_price = (price_min + price_max) / 2

    #VEKTOR USER
    user_vec = [
        1 if pref.get('type') == 'indoor' else 0,
        1 if pref.get('type') == 'outdoor' else 0,
        1 if pref.get('type') == 'both' else 0,
        int(pref.get('wifi', 0)),
        int(pref.get('ac', 0)),
        int(pref.get('musholla', 0)),
        int(pref.get('parkirMotor', 0)),
        int(pref.get('parkirMobil', 0)),
        normalize(rating_user, minmax['minR'], minmax['maxR']) if rating_user else 0,
        normalize(user_price, minmax['minP'], minmax['maxP']) if user_price else 0
    ]


    #PROSES FILTER
    results = []

    for r in RESTAURANTS:
        avg_price = (r['priceMin'] + r['priceMax']) / 2

        #FILTER TIPE
        if pref.get('type'):
            if pref['type'] == 'indoor' and r['type'] not in ['indoor', 'both']:
                continue
            if pref['type'] == 'outdoor' and r['type'] not in ['outdoor', 'both']:
                continue
            if pref['type'] == 'both' and r['type'] != 'both':
                continue

        #FILTER HARGA
        if price_min > 0 and r['priceMin'] < price_min:
            continue

        if price_max > 0 and r['priceMax'] > price_max:
            continue
        
        #FILTER RATING
        if rating_user > 0:
            if r['rating'] < rating_user:
                continue

        #FILTER FASILITAS
        if pref.get('wifi') and not r['wifi']:
            continue
        if pref.get('ac') and not r['ac']:
            continue
        if pref.get('musholla') and not r['musholla']:
            continue
        if pref.get('parkirMotor') and not r['parkirMotor']:
            continue
        if pref.get('parkirMobil') and not r['parkirMobil']:
            continue

        #HITUNG CBF 
        item_vec = to_binary(r) + [
            normalize(r['rating'], minmax['minR'], minmax['maxR']),
            normalize(avg_price, minmax['minP'], minmax['maxP'])
        ]

        score = cosine(user_vec, item_vec)

        r_copy = r.copy()
        r_copy['score'] = score
        results.append(r_copy)

    #SORTING
    if sort == 'rating':
        results.sort(key=lambda x: x['rating'], reverse=True)
    elif sort == 'price-asc':
        results.sort(key=lambda x: x['priceMin'])
    elif sort == 'price-desc':
        results.sort(key=lambda x: x['priceMax'], reverse=True)
    elif sort == 'name':
        results.sort(key=lambda x: x['name'])
    else:
        results.sort(key=lambda x: x['score'], reverse=True)

    return jsonify(results)


#MAIN
if __name__ == '__main__':
    app.run(debug=True)