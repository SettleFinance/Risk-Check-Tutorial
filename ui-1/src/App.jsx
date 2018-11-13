import React, { Component } from 'react';
import classNames from 'classnames';
import chunkedRequest from 'chunked-request';
import { Bar } from 'react-chartjs-2';
import * as _ from 'underscore';
import MDSpinner from "react-md-spinner";
import num from './num';
import ReactTooltip from 'react-tooltip';

const chartOptions = {}

chartOptions.work = {
  layout: {
    padding: {
      left: 0,
      right: 0
    }
  },
  tooltips: {
    enabled: true,
    displayColors: false,
    backgroundColor: '#fff',
    bodyFontColor: '#222',
    callbacks: {
      title: () => {
        return null
      },
      label: (item, data) => {
        return item.yLabel + ' Days'
      }
    }
  },
  legend: {
    display: false
  },
  scales: {
    xAxes: [{
      scaleLabel: {
        fontColor: '#aaa',
        fontSize: 14,
        display: true,
        labelString: 'Portfolio Returns'
      },
      afterFit: function(scaleInstance) {
        scaleInstance.height = 60;
      },
      barPercentage: 1.05,
      categoryPercentage: 1,
      ticks: {
        maxRotation: 90,
        minRotation: 0,
        min: 10,
        fontColor: '#888'
      },
      gridLines: {
        display: false
      }
    }],
    yAxes: [{
      ticks: {
        fontColor: '#888'
      },
      gridLines: {
        display: false
      },
      scaleLabel: {
        fontColor: '#aaa',
        fontSize: 14,
        display: true,
        labelString: 'Days Out Of Past Year'
      },
    }]
  },
  maintainAspectRatio: false
}

chartOptions.helper = {
  layout: {
    padding: {
      left: 0,
      right: 0
    }
  },
  tooltips: {
    intersect: false,
    enabled: true,
    displayColors: false,
    backgroundColor: '#fff',
    bodyFontColor: '#222',
    titleFontColor: '#222',
    callbacks: {
      title: (item, data) => {
        return item[0].xLabel
      },
      label: (item, data) => {
        return item.yLabel + ' Days'
      }
    }
  },
  legend: {
    display: false
  },
  scales: {
    xAxes: [{
      display: false,
      barPercentage: 1.05,
      categoryPercentage: 1,
    }],
    yAxes: [{
      display: false
    }]
  },
  maintainAspectRatio: false
}

export default class extends Component {
  constructor(props){
    super(props);

    this.state = {
      table_data: {},
      histogram_data: [],
      loaded: false,
      update: 'Fetching Token Holdings...',
      hasHoldings: true
    }
  }

  TableRow = (row) => {
    var data = [
      num(this.state.table_data[row.tableProp][0]).FormatPercent(),
      num(this.state.table_data[row.tableProp][1]).FormatCurrency()
    ]

    return !row.hideAlerts || this.props.viewMode !== 'alerts' ? (
      <tr data-tip={ row.tooltip.replace('<data-0>', data[0]) }>
        <th className="text-light">{ row.title }</th>
        <td>{ data[0] }</td>
        {this.props.viewMode === 'work' && (
          <td>{ data[1] }</td>
        )}
      </tr>
    ) : ''
  }

  componentDidMount() {
    var This = this;

    chunkedRequest({
      url: '/api/risk?token=' + this.props.token,
      headers: {
        'Content-Type': 'text/html'
      },
      method: 'GET',
      onChunk: (err, chunk) => {
        _.each(chunk, (chunk) => {
          This.setState({...chunk.data})
        })
      },
      onComplete: (result) => {
        This.setState({loaded: true})
      }
    });
  }

  render() {
    var restTokenCount = this.state.update.tokens && this.state.update.tokens.length > 5 ? this.state.update.tokens.length - 5 : null

    return (
      <div className={classNames('container', 'container-main', 'view-' + this.props.viewMode)}>
        {!this.state.hasHoldings ? (
          <div className="loader">
            <div className="loading-update text-center">
              <h2>No Holdings Available for Risk Analysis</h2>
            </div>
          </div>
        ) : (
          <div>
            {!this.state.loaded ? (
              <div className="loader">
                <MDSpinner singleColor="#888" size="40" borderSize={1} />
                {this.props.viewMode === 'work' ? (
                  <div className="loading-update">
                    { typeof this.state.update === 'string' ?
                      this.state.update
                    : (
                      <div>
                        Calculating Overall Risk For:
                        <div className="tokens">
                          { _.map(_.first(this.state.update.tokens, 5), (token) => (
                            <span key={'token-' + token.id}>
                              <span className="token-icon" style={{backgroundImage: 'url("https://concourseq.io/s3/60x60/icons/' + token.id + '.png")'}}></span>
                              { token.name }
                            </span>
                          ))}
                        </div>
                        And { restTokenCount } More...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="loading-update">
                    <small>Calculating Overall Risk</small>
                  </div>
                )}
              </div>
            ) : (
              <div className="row">
                <div className="col col-1">
                  <ReactTooltip effect="solid" className="tooltip" place="bottom" delayShow={300} />
                  <table className={classNames('table', {small: this.props.viewMode !== 'work'})}>
                    <tbody>
                      { _.map([
                        {
                          title: 'Worst Day',
                          tableProp: 'worst',
                          tooltip: "If you held your current portfolio over the last 365 days (bias adjusted), your worst day would have resulted in a loss of <data-0>"
                        },
                        {
                          title: 'Value at Risk 1%',
                          tableProp: 'var1pct',
                          tooltip: 'Based on the last 365 days of historical returns (bias adjusted), a 1 in 100 bad day would be <data-0>',
                          hideAlerts: true
                        },
                        {
                          title: 'Value at Risk 5%',
                          tableProp: 'var5pct',
                          tooltip: 'Based on the last 365 days of historical returns (bias adjusted), a 1 in 20 bad day would be <data-0>'
                        },
                        {
                          title: 'Best Day',
                          tableProp: 'best',
                          tooltip: 'If you held your current portfolio over the last 365 days (bias adjusted), your best day would have resulted in a gain of <data-0>'
                        },
                        {
                          title: 'Average Day',
                          tableProp: 'avg',
                          tooltip: 'We have adjusted the returns of the historical data so that the average day has a zero return.',
                          hideAlerts: true
                        },
                        {
                          title: 'Daily Standard Deviation',
                          tableProp: 'dayStDev',
                          tooltip: 'Based on the last 365 days of historical returns, the 24H standard deviation of your portfolio would be <data-0>'
                        },
                        {
                          title: 'Annual Standard Deviation',
                          tableProp: 'yrStDev',
                          tooltip: 'Based on daily data, the implied annual standard deviation of your portfolio would be <data-0>'
                        }
                      ], this.TableRow)}
                    </tbody>
                  </table>
                </div>
                <div className="col col-2">
                  {this.props.viewMode !== 'alerts' && (
                    <div className="chart-container">
                      <Bar
                        data={{
                          labels: _.map(this.state.histogram_data, (item) => {
                            return num(item[0]).FormatPercent()
                          }),
                          datasets: [{
                            data: _.pluck(this.state.histogram_data, 1),
                            backgroundColor: '#5b51c7',
                            hoverBackgroundColor: '#5b51c7',
                            borderWidth: 0,
                          }]
                        }}
                        options={ chartOptions[this.props.viewMode] }
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}
