function minutosParaHora(minutos) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function calcularHorasExtras(totalMinutos, cargaHorariaMinutos) {
    let minutosExtras = totalMinutos - cargaHorariaMinutos;
    return minutosExtras > 0 ? minutosParaHora(minutosExtras) : "00:00";
}

function processFile() {
    const fileInput = document.getElementById('fileInput');
    const cpfFilter = document.getElementById('cpfFilter').value.trim().replace(/\D/g, "");
    const horasTrabalhoInput = document.getElementById('horasTrabalho');

    if (!fileInput.files.length || !cpfFilter || !horasTrabalhoInput.value) {
        console.log("Todos os campos devem ser preenchidos!");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const lines = event.target.result.split('\n');
        const tableBody = document.querySelector('#dataTable tbody');
        tableBody.innerHTML = '';
        const registros = {};

        lines.forEach(line => {
            const lineTrimmed = line.replace(/\s+/g, "");
            if (!lineTrimmed) return;

            const rawData = lineTrimmed.substring(12, 20);
            const [yy, mm, dd] = rawData.split('-');
            const data = `${dd}/${mm}/20${yy}`;

            const hora = lineTrimmed.substring(21, 29);
            const cpfMatch = lineTrimmed.match(/(\d{11})$/);
            const cpf = cpfMatch ? cpfMatch[1] : "CPF inválido";

            if (cpf === cpfFilter) {
                if (!registros[data]) registros[data] = [];
                registros[data].push(hora);
            }
        });

        function horaParaMinutos(hora) {
            const [h, m] = hora.split(':').map(Number);
            return h * 60 + m;
        }

        Object.entries(registros).forEach(([data, horarios]) => {
            horarios.sort();
            const minutosInicio = horaParaMinutos(horarios[0]);
            const minutosFim = horaParaMinutos(horarios[horarios.length - 1]);
            const minutosTrabalhados = minutosFim - minutosInicio;
            const horasTrabalhadas = minutosParaHora(minutosTrabalhados);

            const cargaHorariaMinutos = parseFloat(horasTrabalhoInput.value) * 60;
            const horasExtras = calcularHorasExtras(minutosTrabalhados, cargaHorariaMinutos);

            const row = document.createElement('tr');
            row.innerHTML = `<td>${cpfFilter}</td><td>${data}</td><td>${horarios.join(', ')}</td><td>${horasTrabalhadas}</td><td>${horasExtras}</td>`;
            tableBody.appendChild(row);
        });
    };

    reader.readAsText(file);
}

function verificarCampos() {
    document.getElementById('process').disabled = !(
        document.getElementById('fileInput').files.length > 0 &&
        document.getElementById('cpfFilter').value.trim() &&
        document.getElementById('horasTrabalho').value.trim()
    );
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("process").addEventListener("click", processFile);
    ["cpfFilter", "horasTrabalho", "fileInput"].forEach(id => 
        document.getElementById(id).addEventListener("input", verificarCampos)
    );
});
