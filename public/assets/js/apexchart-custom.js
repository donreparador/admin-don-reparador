$(function () {
    "use strict";
  
    // Fechas (últimos 7 días de ejemplo)
    const categories = [
      "2025-09-14T00:00:00.000Z",
      "2025-09-15T00:00:00.000Z",
      "2025-09-16T00:00:00.000Z",
      "2025-09-17T00:00:00.000Z",
      "2025-09-18T00:00:00.000Z",
      "2025-09-19T00:00:00.000Z",
      "2025-09-20T00:00:00.000Z"
    ];
  
    // Series por estado (ejemplo estático)
    const series = [
      { name: "Pendiente",    data: [20, 18, 22, 25, 30, 28, 26] },
      { name: "Asignado",     data: [10, 15, 14, 20, 18, 22, 25] },
      { name: "En ejecución", data: [ 5,  8, 10, 12, 15, 17, 20] },
      { name: "Finalizado",   data: [ 2,  5,  8, 12, 18, 25, 30] },
      { name: "Cancelado",    data: [ 1,  2,  3,  2,  4,  3,  2] }
    ];
  
    const options = {
      series,
      chart: {
        type: "area",
        height: 350,
        stacked: true,              // <- apilado
        toolbar: { show: false }
      },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 2 },
      fill: {
        type: "gradient",
        gradient: { shadeIntensity: 0.2, opacityFrom: 0.9, opacityTo: 0.6 }
      },
      legend: { position: "top" },
      xaxis: {
        type: "datetime",
        categories
      },
      yaxis: {
        labels: { formatter: (v) => Math.round(v) },
        title: { text: "Solicitudes" }
      },
      tooltip: {
        shared: true,               // <- muestra todas las capas del stack
        intersect: false,
        x: { format: "dd/MM/yy" }
      },
      grid: { strokeDashArray: 3 }
    };
  
    const chart = new ApexCharts(document.querySelector("#chart"), options);
    chart.render();
  });