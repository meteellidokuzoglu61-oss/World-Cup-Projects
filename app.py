from flask import Flask, jsonify, request
from model import predict_match

app = Flask(__name__)


@app.get("/")
def home():
    return (
        "<h1>Sunucu çalışıyor</h1>"
        "<p>Tahmin için /predict?teamA=Türkiye&teamB=Fransa adresini kullanın.</p>"
    )


@app.route("/predict", methods=["GET", "POST"])
def predict():
    if request.method == "GET":
        team_a = request.args.get("teamA", type=str)
        team_b = request.args.get("teamB", type=str)
    else:
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"error": "İstek gövdesi geçerli bir JSON nesnesi olmalıdır."}), 400
        team_a = data.get("teamA")
        team_b = data.get("teamB")

    if not isinstance(team_a, str) or not isinstance(team_b, str):
        return jsonify({"error": "teamA ve teamB metin alanları zorunludur."}), 400

    team_a, team_b = team_a.strip(), team_b.strip()
    if not team_a or not team_b:
        return jsonify({"error": "Takım isimleri boş olamaz."}), 400
    if len(team_a) > 100 or len(team_b) > 100:
        return jsonify({"error": "Takım isimleri en fazla 100 karakter olabilir."}), 400
    if team_a.casefold() == team_b.casefold():
        return jsonify({"error": "İki farklı takım seçilmelidir."}), 400

    try:
        return jsonify(predict_match(team_a, team_b))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except RuntimeError:
        app.logger.exception("Tahmin modeli gerekli veriye erişemedi.")
        return jsonify({"error": "Tahmin verisi şu anda kullanılamıyor."}), 503
    except Exception:
        app.logger.exception("Beklenmeyen tahmin hatası.")
        return jsonify({"error": "Tahmin işlemi tamamlanamadı."}), 500


if __name__ == "__main__":
    # Debug mode must remain disabled outside local debugging.
    app.run(host="127.0.0.1", port=5500, debug=False)
