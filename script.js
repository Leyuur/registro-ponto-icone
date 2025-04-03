function minutosParaHora(minutos) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function calcularHorasExtras(minutosTrabalhados, cargaHorariaMinutos) {
    let minutosExtras = minutosTrabalhados - cargaHorariaMinutos;
    return minutosExtras > 0 ? minutosExtras : 0;
}

function processFile() {
    console.log("Função processFile chamada");

    const fileInput = document.getElementById('fileInput');
    const cpfFilter = document.getElementById('cpfFilter');
    const horasTrabalhoInput = document.getElementById('horasTrabalho');

    if (!fileInput.files.length || !cpfFilter.value || !horasTrabalhoInput.value) {
        console.log("Todos os campos devem ser preenchidos!");
        return;
    }

    const file = fileInput.files[0];

    const reader = new FileReader();
    reader.onload = function(event) {
        console.log("Arquivo carregado");
        const lines = event.target.result.split('\n');

        const tableBody = document.querySelector('#dataTable tbody');
        if (!tableBody) {
            console.log("Elemento #dataTable tbody não encontrado");
            return;
        }

        tableBody.innerHTML = '';
        const registros = {};
        let totalMinutosTrabalhados = 0;
        let totalMinutosExtras = 0;

        let lineCount = 1;
        lines.forEach(line => {
            let lineTrimed = line.replace(/\s+/g, "");
            if (!lineTrimed) return;

            if (lineCount === 1 || lineCount === lines.length - 1) {
                lineCount++;
                return;
            }

            lineCount++;

            const rawData = lineTrimed.substring(12, 20);
            const [yy, mm, dd] = rawData.split('-');
            const data = `${dd}/${mm}/20${yy}`;

            const hora = lineTrimed.substring(21, 29);

            const cpfMatch = lineTrimed.match(/(\d{11})$/);
            let cpf = cpfMatch ? cpfMatch[1] : "CPF inválido";

            if (cpf !== cpfFilter.value) return; // Filtrar apenas o CPF digitado

            if (!registros[cpf]) {
                registros[cpf] = {};
            }
            if (!registros[cpf][data]) {
                registros[cpf][data] = [];
            }
            registros[cpf][data].push(hora);
        });

        function horaParaMinutos(hora) {
            const [h, m] = hora.split(':').map(Number);
            return h * 60 + m;
        }

        Object.entries(registros).forEach(([cpf, datas]) => {
            Object.entries(datas).forEach(([data, horarios]) => {
                horarios.sort(); // Garantir que os horários estejam em ordem crescente

                const minutosInicio = horaParaMinutos(horarios[0]); // Primeiro horário (entrada)
                const minutosFim = horaParaMinutos(horarios[horarios.length - 1]); // Último horário (saída)
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

        // Atualizar os totais na interface
        document.getElementById('totalHorasTrabalhadas').textContent = minutosParaHora(totalMinutosTrabalhados);
        document.getElementById('totalHorasExtras').textContent = minutosParaHora(totalMinutosExtras);

        console.log("Registros finais:", registros);
    };

    reader.readAsText(file);
}

// Ativar o botão somente quando os campos estiverem preenchidos
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
