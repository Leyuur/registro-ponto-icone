function minutosParaHora(minutos) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function calcularHorasExtras(minutosTrabalhados, cargaHorariaMinutos) {
    return minutosTrabalhados > cargaHorariaMinutos ? minutosTrabalhados - cargaHorariaMinutos : 0;
}

function showToast(message, isError = false) {
    Toastify({
        text: message,
        duration: 4000,
        gravity: "top",
        position: "right",
        backgroundColor: isError ? "#d32f2f" : "#4CAF50",
        stopOnFocus: true,
    }).showToast();
}

function processFile() {
    const fileInput = document.getElementById('fileInput');
    const cpfFilter = document.getElementById('cpfFilter');
    const horasTrabalhoInput = document.getElementById('horasTrabalho');
    const salarioInput = document.getElementById('salario');
    const formato = document.getElementById('formato');

    if (!fileInput.files.length || !cpfFilter.value || !horasTrabalhoInput.value) {
        showToast("Todos os campos devem ser preenchidos!", true);
        return;
    }

    const file = fileInput.files[0];
    const salarioMensal = parseFloat(salarioInput.value) || 0;
    const cargaHorariaMensal = 220;
    const valorHora = salarioMensal / cargaHorariaMensal;
    const valorHoraExtra = valorHora * 1.5;

    const reader = new FileReader();
    reader.onload = function(event) {
        const lines = event.target.result.split('\n');
        const tableBody = document.querySelector('#dataTable tbody');
        if (!tableBody) {
            showToast("Elemento da tabela não encontrado!", true);
            return;
        }

        tableBody.innerHTML = '';
        const registros = {};
        const mesesEncontrados = new Set();
        let totalMinutosTrabalhados = 0;
        let totalMinutosExtras = 0;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            let lineTrimed = line.replace(/\s+/g, "");
            if (!lineTrimed) continue;

            if (i === 0 || i === lines.length - 1) continue;

            if (i === 2) {
                if (lineTrimed.length > 38 && formato.value == "Outra") {
                    showToast("Tipo de arquivo inválido para 'Outra'", true);
                    break;
                }

                if (lineTrimed.length < 44 && formato.value == "Unidade 5") {
                    showToast("Tipo de arquivo inválido para 'Unidade 5'", true);
                    break;
                }
            }

            let rawData, yy, mm, dd, data, hora, unidade;

            switch(formato.value) {
                case 'Unidade 5':   
                    unidade = 5;
                    rawData = lineTrimed.substring(12, 20);
                    [yy, mm, dd] = rawData.split('-');
                    data = `${dd}/${mm}/20${yy}`;
                    hora = lineTrimed.substring(21, 29);
                    break;
                case 'Outra': 
                    unidade = 0;
                    rawData = lineTrimed.substring(10, 18);
                    dd = rawData.substring(0, 2);  
                    mm = rawData.substring(2, 4);  
                    yyyy = rawData.substring(4, 8);  
                    data = `${dd}/${mm}/${yyyy}`;
                    hora = lineTrimed.substring(18, 20) + ":" + lineTrimed.substring(20, 22);   
                    break;
            }

            let cpfMatch = (unidade === 5)
                ? lineTrimed.substring(0, 45).match(/(\d{11})$/)
                : lineTrimed.substring(0, 35).match(/(\d{11})$/);

            let cpf = cpfMatch ? cpfMatch[1] : "CPF inválido";
            const cpfFiltro = cpfFilter.value.replace(/\D/g, '');
            if (cpf !== cpfFiltro) continue;

            if (!registros[cpf]) registros[cpf] = {};
            if (!registros[cpf][data]) registros[cpf][data] = [];
            registros[cpf][data].push(hora);

            const nomesMeses = {
                "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril",
                "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto",
                "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro"
            };
            if (nomesMeses[mm]) mesesEncontrados.add(nomesMeses[mm]);
        }

        document.getElementById("h2-mes").innerHTML = Array.from(mesesEncontrados).join('/');

        function horaParaMinutos(hora) {
            const [h, m] = hora.split(':').map(Number);
            return h * 60 + m;
        }

        Object.entries(registros).forEach(([cpf, datas]) => {
            Object.entries(datas).forEach(([data, horarios]) => {
                horarios.sort();
                const minutosInicio = horaParaMinutos(horarios[0]);
                const minutosFim = horaParaMinutos(horarios[horarios.length - 1]);
                const minutosTrabalhados = minutosFim - minutosInicio;
                const horasTrabalhadas = minutosParaHora(minutosTrabalhados);

                const cargaHoraria = parseFloat(horasTrabalhoInput.value) || 8;
                const cargaHorariaMinutos = cargaHoraria * 60;
                const minutosExtras = calcularHorasExtras(minutosTrabalhados, cargaHorariaMinutos);

                totalMinutosTrabalhados += minutosTrabalhados;
                totalMinutosExtras += minutosExtras;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${cpf}</td>
                    <td>${data}</td>
                    <td>${horarios.join(', ')}</td>
                    <td>${horasTrabalhadas}</td>
                    <td>${minutosParaHora(minutosExtras)}</td>
                `;
                tableBody.appendChild(row);
            });
        });

        const totalSalarioBase = (totalMinutosTrabalhados / 60) * valorHora;
        const totalSalarioExtras = (totalMinutosExtras / 60) * valorHoraExtra;
        const salarioTotal = totalSalarioBase + totalSalarioExtras;

        document.getElementById('totalHorasTrabalhadas').textContent = minutosParaHora(totalMinutosTrabalhados);
        document.getElementById('totalHorasExtras').textContent = minutosParaHora(totalMinutosExtras);
        if(document.getElementById('totalSalarioBase')) document.getElementById('totalSalarioBase').textContent = `R$ ${totalSalarioBase.toFixed(2)}`;
        if(document.getElementById('totalSalarioExtras')) document.getElementById('totalSalarioExtras').textContent = `R$ ${totalSalarioExtras.toFixed(2)}`;
        if(document.getElementById('salarioTotal')) document.getElementById('salarioTotal').textContent = `R$ ${salarioTotal.toFixed(2)}`;

        if (Object.keys(registros).length === 0) {
            showToast("Você não tem registros nesta unidade neste mês.", true);
        } else {
            showToast("Arquivo processado com sucesso!");

            const resultado = document.getElementById("h2-mes");
            if (resultado) {
                resultado.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    reader.readAsText(file);
}

function verificarCampos() {
    const fileInput = document.getElementById('fileInput').files.length > 0;
    const cpf = document.getElementById('cpfFilter').value.trim() !== "";
    const horas = document.getElementById('horasTrabalho').value.trim() !== "";

    document.getElementById('process').disabled = !(fileInput && cpf && horas);
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("process").addEventListener("click", processFile);
    document.getElementById("cpfFilter").addEventListener("input", verificarCampos);
    document.getElementById("horasTrabalho").addEventListener("input", verificarCampos);
    document.getElementById("fileInput").addEventListener("change", verificarCampos);
});
