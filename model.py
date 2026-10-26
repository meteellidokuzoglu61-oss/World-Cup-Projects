"""Demo-only World Cup match predictor.

The tiny embedded training dataset is illustrative and is not suitable for
real-world match predictions. Replace it with a documented, validated dataset
before treating probabilities as meaningful.
"""
from pathlib import Path

import pandas as pd
from sklearn.ensemble import RandomForestClassifier

teams = None
teams_path = Path(__file__).with_name("Takımlar.xlsx")

try:
    loaded_teams = pd.read_excel(teams_path)
    required_columns = {"team", "rank"}
    if not required_columns.issubset(loaded_teams.columns):
        raise ValueError("Takımlar.xlsx must contain 'team' and 'rank' columns.")
    teams = loaded_teams.copy()
except Exception as exc:
    # Keep the API importable, but do not silently invent team rankings.
    print(f"Takım dosyası yüklenemedi: {exc}")

# Tiny illustrative dataset only. It is not a validated sports model.
train = pd.DataFrame({
    "rankA": [10, 20, 30, 40, 5, 15],
    "rankB": [20, 10, 25, 35, 12, 8],
    "result": [1, 0, 2, 1, 1, 0],  # 1: home win, 0: away win, 2: draw
})

X = train[["rankA", "rankB"]]
y = train["result"]
model = RandomForestClassifier(random_state=42, n_estimators=100)
model.fit(X, y)


def _rank_for(team_name: str) -> int:
    if teams is None:
        raise RuntimeError("Takım sıralama verisi yüklenemedi.")

    normalized = teams["team"].astype(str).str.strip().str.casefold()
    matches = teams.loc[normalized == team_name.strip().casefold(), "rank"]
    if matches.empty:
        raise ValueError(f"Takım bulunamadı: {team_name}")
    try:
        rank = int(matches.iloc[0])
    except (TypeError, ValueError, OverflowError) as exc:
        raise ValueError(f"Takım sıralaması geçersiz: {team_name}") from exc
    if rank < 1:
        raise ValueError(f"Takım sıralaması pozitif olmalı: {team_name}")
    return rank


def predict_match(teamA_name: str, teamB_name: str) -> dict:
    rank_a = _rank_for(teamA_name)
    rank_b = _rank_for(teamB_name)

    sample = pd.DataFrame([{"rankA": rank_a, "rankB": rank_b}])
    probabilities = model.predict_proba(sample)[0]
    by_class = dict(zip(model.classes_, probabilities))

    return {
        "teamA": teamA_name.strip(),
        "teamB": teamB_name.strip(),
        "ev_kazanir": f"%{round(float(by_class.get(1, 0.0)) * 100, 2)}",
        "deplasman_kazanir": f"%{round(float(by_class.get(0, 0.0)) * 100, 2)}",
        "beraberlik": f"%{round(float(by_class.get(2, 0.0)) * 100, 2)}",
        "model_notu": "Eğitim amaçlı örnek model; olasılıklar gerçek maç tahmini olarak değerlendirilmemelidir.",
    }
