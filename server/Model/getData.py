from datasets import load_dataset

# Load the dataset
ds = load_dataset("Salesforce/wikitext", "wikitext-2-v1", split="train")

# Only use the first 2000 rows:
limit = min(2000, len(ds))
texts = [row["text"] for row in ds.select(range(limit))]

# Write to file
with open("corpus.txt", "w", encoding="utf‑8") as f:
    for t in texts:
        f.write(t.replace("\n", " ") + "\n")
