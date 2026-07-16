'use client';
import { useState, useEffect } from 'react';
import { Code2, Terminal, ShieldAlert, Cpu } from 'lucide-react';
import styles from './docs.module.css';

export default function DocsPage() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/developer/docs`)
      .then(res => res.json())
      .then(data => setSpec(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Developer Hub</h1>
        <p className={styles.subheading}>Explore complete REST API specs, OpenAPI schema declarations, and authorization headers.</p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Code2 size={20} className={styles.activeIcon} />
          <h2>OpenAPI Specification Swagger Specs</h2>
        </div>
        
        {spec ? (
          <div className={styles.specBox}>
            <div className={styles.block}>
              <strong>Title:</strong> {spec.info.title} (v{spec.info.version})
              <p>{spec.info.description}</p>
            </div>

            <div className={styles.block}>
              <strong>Routes Schema Overview:</strong>
              <pre className={styles.codeBlock}>
                {JSON.stringify(spec.paths, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <p>Loading OpenAPI schema definitions...</p>
        )}
      </div>

      <div className={styles.card} style={{marginTop: '24px'}}>
        <div className={styles.cardHeader}>
          <Terminal size={20} className={styles.activeIcon} />
          <h2>Client SDK Code Snippets</h2>
        </div>

        <div className={styles.snippetsGrid}>
          <div className={styles.snippet}>
            <h3>Python Integration</h3>
            <pre className={styles.codeBlock}>
{`import requests

url = "http://localhost:5000/api/predict"
headers = {"Authorization": "Bearer YOUR_JWT_TOKEN"}
data = {
    "CreditScore": 600,
    "Age": 40,
    "Tenure": 3,
    "Balance": 60000.0,
    "NumOfProducts": 2,
    "HasCrCard": 1,
    "IsActiveMember": 1,
    "EstimatedSalary": 50000.0
}

response = requests.post(url, json=data, headers=headers)
print(response.json())`}
            </pre>
          </div>

          <div className={styles.snippet}>
            <h3>NodeJS / Fetch Client</h3>
            <pre className={styles.codeBlock}>
{`fetch('http://localhost:5000/api/predict', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    CreditScore: 600,
    Age: 40,
    Tenure: 3,
    Balance: 60000.0,
    NumOfProducts: 2,
    HasCrCard: 1,
    IsActiveMember: 1,
    EstimatedSalary: 50000.0
  })
})
.then(res => res.json())
.then(data => console.log(data));`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
