async function run() {
  const payload = [
    {
      descricao: "SIMPLES",
      valor: 4.5,
      ano: 2026,
      mes: 5,
      categoriaId: 1
    },
    {
      descricao: "METODO DE PAGAMENTO",
      valor: 1.7,
      ano: 2026,
      mes: 5,
      categoriaId: 1
    }
  ];

  try {
    const res = await fetch('http://localhost:3000/api/finance/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Data:', data);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

run();
