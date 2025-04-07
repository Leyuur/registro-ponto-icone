function minutosParaHora(minutos) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function calcularHorasExtras(minutosTrabalhados, cargaHorariaMinutos) {
    return minutosTrabalhados > cargaHorariaMinutos ? minutosTrabalhados - cargaHorariaMinutos : 0;
}

function processFile() {
    console.log("Função processFile chamada");

    const fileInput = document.getElementById('fileInput');
    const cpfFilter = document.getElementById('cpfFilter');
    const horasTrabalhoInput = document.getElementById('horasTrabalho');
    const salarioInput = document.getElementById('salario');
    const formato = document.getElementById('formato');

    if (!fileInput.files.length || !cpfFilter.value || !horasTrabalhoInput.value) {
        console.log("Todos os campos devem ser preenchidos!");
        return;
    }

    const file = fileInput.files[0];
    const salarioMensal = parseFloat(salarioInput.value) || 0;
    const cargaHorariaMensal = 220;
    const valorHora = salarioMensal / cargaHorariaMensal;
    const valorHoraExtra = valorHora * 1.5;

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

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            let lineTrimed = line.replace(/\s+/g, "");
            if (!lineTrimed) continue;
        
            if (i === 0 || i === lines.length - 1) {
                console.log(lineTrimed) 
                continue;
            }
                console.log(lineTrimed.length)

            if (i === 2) {
                if (lineTrimed.length > 38 && formato.value == "Outra") {
                    alert("Tipo de arquivo inválido para " + formato.value);
                    break;
                }
    
                if (lineTrimed.length < 44 && formato.value == "Unidade 5") {
                    alert("Tipo de arquivo inválido para " + formato.value);
                    break;
                }
            }
            
        
            let rawData;
            let yy, mm, dd;
            let data;
            let hora;
            let unidade;
        
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
                    console.log("Data extraída:", data);
                
                    hora = lineTrimed.substring(18, 20) + ":" + lineTrimed.substring(20, 22);   
                    break;
            }

            let cpfMatch;
            if(unidade === 5) cpfMatch = lineTrimed.substring(0, 45).match(/(\d{11})$/);
            else cpfMatch = lineTrimed.substring(0, 35).match(/(\d{11})$/);

            
            let cpf = cpfMatch ? cpfMatch[1] : "CPF inválido";

            console.log("CPF extraído:", cpf, "| CPF filtro:", cpfFilter.value);


            const cpfFiltro = cpfFilter.value.replace(/\D/g, '');


            if (cpf !== cpfFiltro) continue;

            if (!registros[cpf]) {
                registros[cpf] = {};
            }
            if (!registros[cpf][data]) {
                registros[cpf][data] = [];
            }
            registros[cpf][data].push(hora);

            console.log(registros)

            let tituloMes = document.getElementById("h2-mes")

            switch (mm) {
                case "01":
                    tituloMes.innerHTML = "Janeiro";
                    break;
                case "02":
                    tituloMes.innerHTML = "Fevereiro";
                    break;
                case "03":
                    tituloMes.innerHTML = "Março";
                    break;
                case "04":
                    tituloMes.innerHTML = "Abril";
                    break;
                case "05":
                    tituloMes.innerHTML = "Maio";
                    break;
                case "06":
                    tituloMes.innerHTML = "Junho";
                    break;
                case "07":
                    tituloMes.innerHTML = "Julho";
                    break;
                case "08":
                    tituloMes.innerHTML = "Agosto";
                    break;
                case "09":
                    tituloMes.innerHTML = "Setembro";
                    break;
                case "10":
                    tituloMes.innerHTML = "Outubro";
                    break;
                case "11":
                    tituloMes.innerHTML = "Novembro";
                    break;
                case "12":
                    tituloMes.innerHTML = "Dezembro";
                    break;
                default:
                    tituloMes.innerHTML = "";
            }
            
        }

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

        

        // Cálculo do pagamento total e das horas extras
        const totalSalarioBase = (totalMinutosTrabalhados / 60) * valorHora;
        const totalSalarioExtras = (totalMinutosExtras / 60) * valorHoraExtra;
        const salarioTotal = totalSalarioBase + totalSalarioExtras;

        // Atualizar os totais na interface
        document.getElementById('totalHorasTrabalhadas').textContent = minutosParaHora(totalMinutosTrabalhados);
        document.getElementById('totalHorasExtras').textContent = minutosParaHora(totalMinutosExtras);
        if(document.getElementById('totalSalarioBase'))document.getElementById('totalSalarioBase').textContent = `R$ ${totalSalarioBase.toFixed(2)}`;
        if(document.getElementById('totalSalarioExtras'))document.getElementById('totalSalarioExtras').textContent = `R$ ${totalSalarioExtras.toFixed(2)}`;
        if(document.getElementById('salarioTotal'))document.getElementById('salarioTotal').textContent = `R$ ${salarioTotal.toFixed(2)}`;

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
