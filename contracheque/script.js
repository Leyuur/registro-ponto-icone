async function buscarContracheque() {
    const cpf = document.getElementById('cpf').value.trim();
    const iframe = document.getElementById('contracheque-pdf');
    const popup = document.getElementById('popup');
  
    if (cpf.length !== 11 || isNaN(cpf)) {
      alert("Por favor, digite um CPF válido com 11 dígitos.");
      return;
    }
  
    try {
      const response = await fetch('data.json'); // certifique-se que o nome do arquivo está correto
      const data = await response.json();
  
      if (data[cpf]) {
        const pdfUrl = data[cpf];
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
        if (isMobile) {
          window.open(pdfUrl, '_blank');
        } else {iframe
          iframe.src = pdfUrl;
          popup.style.display = 'flex';
        }
      } else {
        alert("CPF não encontrado.");
      }
    } catch (error) {
      console.error("Erro ao carregar os dados:", error);
      alert("Erro ao buscar contracheque.");
    }
  }
  
  function fecharPopup() {
    document.getElementById('popup').style.display = 'none';
  }
  