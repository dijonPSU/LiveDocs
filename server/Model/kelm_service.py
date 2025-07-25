from flask import Flask, request, jsonify
import kenlm

# Load trained kenlm model
model = kenlm.Model('/Users/dijonmiller/meta-codepath/LiveDocs/server/RankingModel/my_wikitext3.arpa')


def score_suggestion(context, suggestion):
    #Calculates the conditional log-probability of the suggestion given the context using KenLM
    #Higher score = more likely suggestion given the previous words (context)

    context = context.strip()
    full = f"{context} {suggestion}".strip()

    if context:
        return model.score(full, bos=False) - model.score(context, bos=False)
    else:
        return model.score(full, bos=False)

app = Flask(__name__)

@app.route('/rank', methods=['POST'])

def rank():
    data = request.json
    context = data.get('context', '')
    candidates = data.get('candidates', [])

    # Score each candidate suggestion using the KenLM model
    scored = [
        {"suggestion": s, "score": score_suggestion(context, s)}
        for s in candidates
    ]

    # Sort descending by score (highest first)
    scored.sort(key=lambda x: x["score"], reverse=True)
    return jsonify([x["suggestion"] for x in scored])

if __name__ == "__main__":
    app.run(port=5005)
