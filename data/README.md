# Data Directory

The German Credit dataset is downloaded automatically by running:

```powershell
cd "c:\Users\ganes\Downloads\AI project\credintel-ai\backend"
.\venv\Scripts\activate
python scripts\download_data.py
```

## Dataset Details

- **Name**: Statlog (German Credit Data)
- **Source**: [UCI Machine Learning Repository](https://archive.ics.uci.edu/ml/datasets/statlog+(german+credit+data))
- **Records**: 1,000 loan applications
- **Features**: 20 (mix of numerical and categorical)
- **Target**: Credit risk (1 = Good/Low Risk, 2 = Bad/High Risk in original; mapped to 1=Bad, 0=Good in this project)
- **Era**: West Germany, 1970s-1980s

## Target Definition

| Original Value | Mapped Value | Meaning |
|---|---|---|
| 1 | 0 | Good credit — applicant paid back the loan |
| 2 | 1 | Bad credit — applicant defaulted or had issues |

The model predicts `1 = Bad Credit Risk`, `0 = Good Credit Risk`.

## License

The UCI ML Repository dataset is publicly available for research purposes. See the repository page for full attribution.

## Note on Data Files

`german_credit.csv` is NOT committed to git to avoid potential licensing concerns and to keep repository size small. Always run the download script to regenerate it locally.
