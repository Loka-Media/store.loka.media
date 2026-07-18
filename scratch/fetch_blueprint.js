const PRINTIFY_API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzN2Q0YmQzMDM1ZmUxMWU5YTgwM2FiN2VlYjNjY2M5NyIsImp0aSI6Ijc4YTI5ZWI0ZWU1YzZlZDMwN2EwNjA5NGMxMWY5OWNiYzBjZmJkMDM1ODY5MmIyYTVmOWNiMzEyYmNhZDRkMzgxNWFkZmZlZDM4OTc1NzEyIiwiaWF0IjoxNzgwOTg4MTM1LjcxNDQ0NCwibmJmIjoxNzgwOTg4MTM1LjcxNDQ0NiwiZXhwIjoxODEyNTI0MTM1LjcwNzUwOCwic3ViIjoiMTQ0NTk4NjkiLCJzY29wZXMiOlsic2hvcHMubWFuYWdlIiwic2hvcHMucmVhZCIsImNhdGFsb2cucmVhZCIsIm9yZGVycy5yZWFkIiwib3JkZXJzLndyaXRlIiwicHJvZHVjdHMucmVhZCIsInByb2R1Y3RzLndyaXRlIiwid2ViaG9va3MucmVhZCIsIndlYmhvb2tzLndyaXRlIiwidXBsb2Fkcy5yZWFkIiwidXBsb2Fkcy53cml0ZSIsInByaW50X3Byb3ZpZGVycy5yZWFkIiwidXNlci5pbmZvIl19.ABpwK07HHU7MD31W7P8fx63EF2un-kK40B56qBa9OElyThijn6H9wmdmXUz8_PwPxiroKRXk6STKmvuDr4sHgjBeFZEVAak6RDPk63I4u1ovJdFOgFafTY2HrQjuc_9o4wE0_-QkpEP6uyO1H9tpqQeIzGPnE3ZmbW1aAbBNZb4tE3H1By1IMuz_8CBH0_k3x-me8ZyBu-1N5W09Z_LB41QmV3LmOyVegeKB-uaw5Gc0Png-Lt9Vm0n4w66HqQU8yBQtFs4jLkT-YmwhNphGx8PkyCo1a5TfWQOGZJ_DEni0xFEaIMlcSfTvquVVuTtU_6Ngp8kx_-zM1h7ep-grqAJUkrd3yMS5e738oA8zX2AmscJI_mmzCqBl-xmNky1YpueTB40jeMYdnApB-Qj36zyLtyqVf4mQCUZvljLc5i0qR4rreO_znP0uz9RJxasWf9T1tKimTnIi1St81yqJIgZC53EhKAdmn3ap6fQl0lKIam7aBSPzPPmBqoWcho4ZFMz1JvGqLGlKDm6C5BjPWn5YHG7tXBDqsa-2YIb7jts6wGEsy7sZIyciLbB6kYpH4B6vg1FNgNj_PXP_e9CUWA73gKosurS1X74XmO-GkBWJHoKCl8KWYIodWsSoLlCzaJrkKTjll3E5bLGkdkw8aHyVcHP-s0dI49f_PHA_C4Q";

async function run() {
  const ids = [6, 12, 706, 77, 78];
  for (const id of ids) {
    console.log(`\n--- Blueprint ${id} ---`);
    const res = await fetch(`https://api.printify.com/v1/catalog/blueprints/${id}.json`, {
      headers: {
        Authorization: `Bearer ${PRINTIFY_API_KEY}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      console.log('Title:', data.title);
      console.log('Images:', data.images);
    } else {
      console.log('Failed to fetch:', res.status);
    }
  }
}
run();
