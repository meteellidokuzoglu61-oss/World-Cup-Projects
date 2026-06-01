from flask import Flask, request, jsonify
from model import predict_match 

app = Flask(__name__)

# 1. Ana Sayfa Testi
@app.route("/")
def home():
    return "<h1>Sunucu Çalışıyor!</h1><p>Tahmin için: <b>/predict</b> adresini kullanın.</p>"

# 2. Tahmin Rotası (Hem GET hem POST destekli hale getirdim)
@app.route("/predict", methods=["GET", "POST"])
def predict():
    try:
        # Eğer tarayıcıdan (URL ile) test ediliyorsa:
        if request.method == "GET":
            teamA = request.args.get("teamA")
            teamB = request.args.get("teamB")
            
            if not teamA or not teamB:
                return jsonify({"uyari": "URL sonuna şunu ekleyerek test edin: ?teamA=Turkiye&teamB=Fransa"})
        
        # Eğer dışarıdan JSON (POST) geliyorsa:
        else:
            data = request.json
            teamA = data.get("teamA")
            teamB = data.get("teamB")

        if not teamA or not teamB:
            return jsonify({"error": "Takım isimleri eksik!"}), 400

        result = predict_match(teamA, teamB)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5500, debug=True)