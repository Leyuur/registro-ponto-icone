function minutosParaHora(minutos) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function horaParaMinutos(hora) {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
}

function calcularHorasExtras(minutosTrabalhados, cargaHorariaMinutos) {
    return minutosTrabalhados > cargaHorariaMinutos ? minutosTrabalhados - cargaHorariaMinutos : 0;
}

function processFile() {
    const fileInput = document.getElementById('fileInput');
    const cpfFilter = document.getElementById('cpfFilter');
    const salarioInput = document.getElementById('salario');
    const formato = document.getElementById('formato');

    if (!fileInput.files.length || !cpfFilter.value) {
        alert("Preencha todos os campos obrigatórios.");
        return;
    }

    const files = Array.from(fileInput.files);
    const salarioMensal = parseFloat(salarioInput.value) || 0;
    const cargaHorariaMensal = 220;
    const valorHora = salarioMensal / cargaHorariaMensal;
    const valorHoraExtra = valorHora * 1.5;

    const tableBody = document.querySelector('#dataTable tbody');
    tableBody.innerHTML = '';

    const registros = {};
    const minutosPorDia = [];

    let arquivosProcessados = 0;
    let totalMinutosTrabalhados = 0;
    let totalMinutosExtras = 0;

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function (event) {
            const lines = event.target.result.split('\n');

            for (let i = 0; i < lines.length; i++) {
                let line = lines[i].replace(/\s+/g, "");
                if (!line) continue;
                if (i === 0 || i === lines.length - 1) continue;

                if (i === 2) {
                    if (line.length > 38 && formato.value === "Outra") {
                        alert("Tipo de arquivo inválido para " + formato.value);
                        break;
                    }
                    if (line.length < 44 && formato.value === "Unidade 5") {
                        alert("Tipo de arquivo inválido para " + formato.value);
                        break;
                    }
                }

                let data, hora;
                switch (formato.value) {
                    case 'Unidade 5':
                        const rawData1 = line.substring(12, 20);
                        const [yy, mm, dd] = rawData1.split('-');
                        data = `${dd}/${mm}/20${yy}`;
                        hora = line.substring(21, 29);
                        break;
                    case 'Outra':
                        const rawData2 = line.substring(11, 18);
                        const dd2 = rawData2.substring(0, 2);
                        const mm2 = rawData2.substring(2, 4);
                        const yyyy2 = rawData2.substring(4, 8);
                        data = `${dd2}/${mm2}/${yyyy2}`;
                        hora = line.substring(18, 20) + ":" + line.substring(20, 22);
                        break;
                }

                const cpfMatch = line.substring(0, 45).match(/(\d{11})$/);
                const cpf = cpfMatch ? cpfMatch[1] : "CPF inválido";
                if (cpf !== cpfFilter.value) continue;

                if (!registros[data]) registros[data] = [];
                registros[data].push(hora);
            }

            arquivosProcessados++;
            if (arquivosProcessados === files.length) {
                // Organizar por data
                const datasOrdenadas = Object.keys(registros).sort((a, b) => {
                    const [da, ma, aa] = a.split('/').map(Number);
                    const [db, mb, ab] = b.split('/').map(Number);
                    return new Date(aa, ma - 1, da) - new Date(ab, mb - 1, db);
                });

                // Calcular carga horária média (mediana)
                datasOrdenadas.forEach(data => {
                    const horarios = registros[data].sort();
                    const entrada = horaParaMinutos(horarios[0]);
                    const saida = horaParaMinutos(horarios[horarios.length - 1]);
                    const minutosTrabalhados = saida - entrada;
                    minutosPorDia.push(minutosTrabalhados);
                });

                minutosPorDia.sort((a, b) => a - b);
                let cargaHorariaMinutos;
                const mid = Math.floor(minutosPorDia.length / 2);
                if (minutosPorDia.length % 2 === 0) {
                    cargaHorariaMinutos = Math.round((minutosPorDia[mid - 1] + minutosPorDia[mid]) / 2);
                } else {
                    cargaHorariaMinutos = minutosPorDia[mid];
                }

                // Montar tabela
                datasOrdenadas.forEach(data => {
                    const horarios = registros[data].sort();
                    const entrada = horaParaMinutos(horarios[0]);
                    const saida = horaParaMinutos(horarios[horarios.length - 1]);
                    const minutosTrabalhados = saida - entrada;
                    const horasTrabalhadas = minutosParaHora(minutosTrabalhados);
                    const minutosExtras = calcularHorasExtras(minutosTrabalhados, cargaHorariaMinutos);

                    totalMinutosTrabalhados += minutosTrabalhados;
                    totalMinutosExtras += minutosExtras;

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${cpfFilter.value}</td>
                        <td>${data}</td>
                        <td>${horarios.join(', ')}</td>
                        <td>${horasTrabalhadas}</td>
                        <td>${minutosParaHora(minutosExtras)}</td>
                    `;
                    tableBody.appendChild(row);
                });

                // Totais
                const totalSalarioBase = (totalMinutosTrabalhados / 60) * valorHora;
                const totalSalarioExtras = (totalMinutosExtras / 60) * valorHoraExtra;
                const salarioTotal = totalSalarioBase + totalSalarioExtras;

                document.getElementById('totalHorasTrabalhadas').textContent = minutosParaHora(totalMinutosTrabalhados);
                document.getElementById('totalHorasExtras').textContent = minutosParaHora(totalMinutosExtras);
                if (document.getElementById('totalSalarioBase')) document.getElementById('totalSalarioBase').textContent = `R$ ${totalSalarioBase.toFixed(2)}`;
                if (document.getElementById('totalSalarioExtras')) document.getElementById('totalSalarioExtras').textContent = `R$ ${totalSalarioExtras.toFixed(2)}`;
                if (document.getElementById('salarioTotal')) document.getElementById('salarioTotal').textContent = `R$ ${salarioTotal.toFixed(2)}`;

                document.getElementById("downloadExcel").disabled = false;

                // Exibir mês no título
                if (datasOrdenadas.length > 0) {
                    const [dia, mes, ano] = datasOrdenadas[0].split("/");
                    const nomesMeses = {
                        "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril",
                        "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto",
                        "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro"
                    };
                    const nomeMes = nomesMeses[mes] || "Mês desconhecido";
                    const textoFinal = `${nomeMes} ${ano}`;
                    document.getElementById("h2-mes").textContent = textoFinal;
                    document.getElementById("h2-mes").scrollIntoView({ behavior: 'smooth' });
                }
            }
        };
        reader.readAsText(file); // ✅ Correto: fora do onload
    });
}

function verificarCampos() {
    const fileInput = document.getElementById('fileInput').files.length > 0;
    const cpf = document.getElementById('cpfFilter').value.trim() !== "";
    document.getElementById('process').disabled = !(fileInput && cpf);
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("process").addEventListener("click", processFile);
    document.getElementById("cpfFilter").addEventListener("input", verificarCampos);
    document.getElementById("fileInput").addEventListener("change", verificarCampos);
});

document.getElementById("downloadExcel").addEventListener("click", () => {
    const cpf = document.getElementById("cpfFilter").value.trim();
    const unidade = document.getElementById("formato").value;
    const table = document.getElementById("dataTable");
    const linhasHTML = table.querySelectorAll("tbody tr");

    const primeiraData = linhasHTML[0]?.querySelector("td:nth-child(2)")?.textContent || "";
    let nomeMesAno = "Registros";
    if (primeiraData) {
        const [dia, mes, ano] = primeiraData.split("/");
        const meses = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];
        nomeMesAno = `${meses[parseInt(mes) - 1]} ${ano}`;
    }

    const dadosComTitulo = [];
    dadosComTitulo.push([, , `Registros de ${nomeMesAno}`]);
    dadosComTitulo.push([, , `Unidade: ${unidade}`]);
    dadosComTitulo.push([]);
    dadosComTitulo.push(["CPF", "Data", "Horários", "Total Trabalhado", "Horas Extras"]);

    linhasHTML.forEach(tr => {
        const tds = tr.querySelectorAll("td");
        const linha = Array.from(tds).map(td => td.textContent.trim());
        dadosComTitulo.push(linha);
    });

    const wsFinal = XLSX.utils.aoa_to_sheet(dadosComTitulo);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsFinal, nomeMesAno);
    const nomeArquivo = `registros_${cpf}_${nomeMesAno.replace(" ", "_")}.xlsx`;
    XLSX.writeFile(wb, nomeArquivo);
});
