<<<<<<< HEAD
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

# Veriyi güvenli yükleme
try:
    teams = pd.read_excel("Takımlar.xlsx")
except Exception as e:
    print(f"Hata: Takımlar.xlsx yüklenemedi: {e}")

# Basit bir eğitim seti (Modelin çalışması için minimum veri)
train = pd.DataFrame({
    "rankA": [10, 20, 30, 40, 5, 15],
    "rankB": [20, 10, 25, 35, 12, 8],
    "result": [1, 0, 2, 1, 1, 0]  # 1: Ev, 0: Dep, 2: Beraber
})

X = train[["rankA", "rankB"]]
y = train["result"]

model = RandomForestClassifier()
model.fit(X, y)

def predict_match(teamA_name, teamB_name):
    # Excel'den sıralamaları çek (Bulamazsa varsayılan 50 ver)
    try:
        rankA = int(teams[teams["team"] == teamA_name]["rank"].values[0])
        rankB = int(teams[teams["team"] == teamB_name]["rank"].values[0])
    except:
        rankA, rankB = 50, 50

    probs = model.predict_proba([[rankA, rankB]])[0]

    return {
        "teamA": teamA_name,
        "teamB": teamB_name,
        "ev_kazanir": f"%{round(probs[1]*100, 2)}",
        "deplasman_kazanir": f"%{round(probs[0]*100, 2)}",
        "beraberlik": f"%{round(probs[2]*100, 2)}"
=======
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

# Veriyi güvenli yükleme
try:
    teams = pd.read_excel("Takımlar.xlsx")
except Exception as e:
    print(f"Hata: Takımlar.xlsx yüklenemedi: {e}")

# Basit bir eğitim seti (Modelin çalışması için minimum veri)
train = pd.DataFrame({
    "rankA": [10, 20, 30, 40, 5, 15],
    "rankB": [20, 10, 25, 35, 12, 8],
    "result": [1, 0, 2, 1, 1, 0]  # 1: Ev, 0: Dep, 2: Beraber
})

X = train[["rankA", "rankB"]]
y = train["result"]

model = RandomForestClassifier()
model.fit(X, y)

def predict_match(teamA_name, teamB_name):
    # Excel'den sıralamaları çek (Bulamazsa varsayılan 50 ver)
    try:
        rankA = int(teams[teams["team"] == teamA_name]["rank"].values[0])
        rankB = int(teams[teams["team"] == teamB_name]["rank"].values[0])
    except:
        rankA, rankB = 50, 50

    probs = model.predict_proba([[rankA, rankB]])[0]

    return {
        "teamA": teamA_name,
        "teamB": teamB_name,
        "ev_kazanir": f"%{round(probs[1]*100, 2)}",
        "deplasman_kazanir": f"%{round(probs[0]*100, 2)}",
        "beraberlik": f"%{round(probs[2]*100, 2)}"
>>>>>>> c2b76482eca378b7e8722c722698ad6b344dec60
    }