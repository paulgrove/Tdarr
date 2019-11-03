import {withTracker} from 'meteor/react-meteor-data';
import React, {Component} from 'react';
import {Button} from 'react-bootstrap';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import ReactDOM, {render} from 'react-dom';
import ClipLoader from 'react-spinners/ClipLoader';
import ReactTable from 'react-table';
import {Tab, TabList, TabPanel, Tabs} from 'react-tabs';
import Modal from 'reactjs-popup';

import {GlobalSettingsDB} from '../../api/tasks.js';

var ButtonStyle = {
  display: 'inline-block',
};

// App component - represents the whole app
class App extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    //this.searchPlugins()

    this.searchPlugins(event, 'Community');
  }

  updatePlugins = () => {
    GlobalSettingsDB.upsert('globalsettings', {
      $set: {
        pluginSearchLoading: true,
      },
    });

    Meteor.call(
      'updatePlugins',
      ReactDOM.findDOMNode(this.refs.searchStringCommunity).value.trim(),
      () => {
        setTimeout(event => this.searchPlugins(event, 'Community'), 5000);
      }
    );
  };

  renderSearchButtons(pluginType) {
    return this.props.globalSettings.map(item => {
      if (item.pluginSearchLoading == true) {
        return (
          <ClipLoader
            sizeUnit={'px'}
            size={25}
            color={'white'}
            loading={true}
          />
        );
      } else {
        return (
          <div>
            <Button
              variant="outline-light"
              className="addFolderButton"
              onClick={event => this.searchPlugins(event, pluginType)}
              style={ButtonStyle}
            >
              <span className="buttonTextSize">Search</span>
            </Button>
            <Button
              variant="outline-light"
              className="addFolderButton"
              onClick={() => {
                render(
                  '',
                  document.getElementById('searchResults' + pluginType)
                );
              }}
              style={ButtonStyle}
            >
              <span className="buttonTextSize">Clear</span>
            </Button>

            {pluginType == 'Community' ? (
              <Button
                variant="outline-light"
                className="addFolderButton"
                onClick={this.updatePlugins}
                style={ButtonStyle}
              >
                <span className="buttonTextSize">Update community plugins</span>
              </Button>
            ) : null}

            <Button
              variant="outline-light"
              className="addFolderButton"
              onClick={() =>
                window.open(
                  'https://github.com/HaveAGitGat/Tdarr_Plugins',
                  '_blank'
                )
              }
              style={ButtonStyle}
            >
              <span className="buttonTextSize">Create a plugin</span>
            </Button>

            <Modal
              trigger={
                <Button variant="outline-light">
                  <span className="buttonTextSize">i</span>
                </Button>
              }
              modal
              closeOnDocumentClick
            >
              <div className="modalContainer">
                <div className="frame">
                  <div className="scroll">
                    <div className="modalText">
                      <p></p>
                      <p>
                        Copy a community plugin id into the 'Plugin ID:' section
                        of one of your libraries. Make sure the 'Community'
                        checkbox is selected.
                      </p>
                      <p></p>
                      <p></p>

                      <p>
                        For information on creating community and local plugins,
                        have a look
                        at:https://github.com/HaveAGitGat/Tdarr_Plugins
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Modal>
          </div>
        );
      }
    });
  }

  searchPlugins = (event, pluginType) => {
    if (event) {
      event.preventDefault();
    }

    GlobalSettingsDB.upsert('globalsettings', {
      $set: {
        pluginSearchLoading: true,
      },
    });

    var string = 'searchString' + pluginType;

    Meteor.call(
      'searchPlugins',
      ReactDOM.findDOMNode(this.refs[string]).value.trim(),
      pluginType,
      (error, result) => {
        if (result[0].length == 0) {
          render(
            <center>No results</center>,
            document.getElementById('searchResults' + result[1])
          );
        } else {
          var data = result[0];

          const columns = [
            {
              Header: () => (
                <div className="pluginTableHeader">
                  <p>id</p>
                </div>
              ),
              id: 'id',
              width: 70,
              accessor: d => (
                <CopyToClipboard text={d.id}>
                  <Button variant="outline-light">
                    <span className="buttonTextSize">Copy id</span>
                  </Button>
                </CopyToClipboard>
              ),
            },
            {
              Header: () => (
                <div className="pluginTableHeader">
                  <p>Name</p>
                </div>
              ),
              accessor: 'Name',
              width: 200,
              getProps: () => {
                return {
                  style: {
                    color: '#e1e1e1',
                    fontSize: '14px',
                  },
                };
              },
            },
            {
              Header: () => (
                <div className="pluginTableHeader">
                  <p>Type</p>
                </div>
              ),
              accessor: 'Type',
              width: 100,
              getProps: () => {
                return {
                  style: {
                    color: '#e1e1e1',
                    fontSize: '14px',
                  },
                };
              },
            },
            {
              Header: () => (
                <div className="pluginTableHeader">
                  <p>Description</p>
                </div>
              ),
              accessor: 'Description',

              id: 'Description',
              //   accessor: d => {

              //     console.log("d.Description:"+d.Description)
              //       var desc = d.Description.split("\n")
              //         desc = desc.map( row => <p>{row}<br/></p> )

              //         console.dir("desc:"+desc)

              //         return desc

              //   },

              style: {'white-space': 'unset'},

              getProps: () => {
                return {
                  style: {
                    color: '#e1e1e1',
                    fontSize: '14px',
                  },
                };
              },
            },
            {
              Header: () => (
                <div className="pluginTableHeader">
                  <p>Version</p>
                </div>
              ),
              accessor: 'Version',
              width: 100,

              getProps: () => {
                return {
                  style: {
                    color: '#e1e1e1',
                    fontSize: '14px',
                  },
                };
              },
            },
            {
              Header: () => (
                <div className="pluginTableHeader">
                  <p>Stars</p>
                </div>
              ),
              accessor: 'Stars',
              width: 100,
              getProps: () => {
                return {
                  style: {
                    color: '#e1e1e1',
                    fontSize: '14px',
                  },
                };
              },
            },
            {
              Header: () => (
                <div className="pluginTableHeader">
                  <p>Link</p>
                </div>
              ),
              id: 'Link',
              accessor: row => (
                <p>
                  <a
                    href=""
                    onClick={e => {
                      e.preventDefault();
                      window.open(row.Link, '_blank');
                    }}
                  >
                    {row.Link}
                  </a>
                </p>
              ),
              width: 100,
              getProps: () => {
                return {
                  style: {
                    color: '#e1e1e1',
                    fontSize: '14px',
                  },
                };
              },
            },
          ];

          render(
            <div>
              <ReactTable
                data={data}
                columns={columns}
                defaultPageSize={100}
                pageSizeOptions={[10, 100, 1000]}
              />
            </div>,
            document.getElementById('searchResults' + result[1])
          );
        }
      }
    );
  };

  render() {
    return (
      <div className="containerGeneral">
        <div className="tabWrap">
          <Tabs>
            <TabList>
              <Tab>
                <p>Community</p>
              </Tab>
              <Tab>
                <p>Local</p>
              </Tab>
            </TabList>

            <TabPanel>
              <div className="tabContainer">
                <br />
                <br />

                <form
                  onSubmit={event => this.searchPlugins(event, 'Community')}
                >
                  <center>
                    <input
                      type="text"
                      className="searchBar"
                      ref="searchStringCommunity"
                      placeholder="Search for plugins by any property. E.g.  h264,mp4"
                    ></input>
                  </center>

                  <p></p>

                  <center>{this.renderSearchButtons('Community')}</center>
                </form>

                <p></p>
                <p></p>

                <div className="libraryContainer">
                  <div id="searchResultsCommunity"></div>
                </div>
              </div>
            </TabPanel>

            <TabPanel>
              <div className="tabContainer">
                <br />
                <br />

                <form onSubmit={event => this.searchPlugins(event, 'Local')}>
                  <center>
                    <input
                      type="text"
                      className="searchBar"
                      ref="searchStringLocal"
                      placeholder="Search for plugins by any property. E.g.  h264,mp4"
                    ></input>
                  </center>

                  <p></p>

                  <center>{this.renderSearchButtons('Local')}</center>
                </form>

                <p></p>
                <p></p>

                <div className="libraryContainer">
                  <div id="searchResultsLocal"></div>
                </div>
              </div>
            </TabPanel>
          </Tabs>
        </div>
      </div>
    );
  }
}

export default withTracker(() => {
  Meteor.subscribe('GlobalSettingsDB');

  return {
    globalSettings: GlobalSettingsDB.find({}, {}).fetch(),
  };
})(App);