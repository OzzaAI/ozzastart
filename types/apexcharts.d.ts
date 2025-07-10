declare module 'react-apexcharts' {
  import { Component } from 'react';
  import { ApexOptions } from 'apexcharts';

  interface Props {
    type?: 
      | 'line'
      | 'area'
      | 'bar'
      | 'pie'
      | 'donut'
      | 'radialBar'
      | 'scatter'
      | 'bubble'
      | 'heatmap'
      | 'candlestick'
      | 'boxPlot'
      | 'radar'
      | 'polarArea'
      | 'rangeBar'
      | 'treemap'
      | 'histogram';
    series: ApexAxisChartSeries | ApexNonAxisChartSeries;
    options?: ApexOptions;
    width?: string | number;
    height?: string | number;
  }

  export default class Chart extends Component<Props> {}
}