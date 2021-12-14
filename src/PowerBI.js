// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
// ----------------------------------------------------------------------------

import React from "react";
import { UserAgentApplication, AuthError, AuthResponse } from "msal";
import { service, factories, models, IEmbedConfiguration } from "powerbi-client";
import "./App.css";
const config = {
  scopes : ["https://analysis.windows.net/powerbi/api/Report.Read.All"],
clientId : "3d7b657e-3d14-4508-8500-16745099a977",
workspaceId : "6ff828e7-cc5b-484e-852b-8a34ddc0c1ad",
reportId : "b38e2a51-5d9f-47a7-95f3-5add3c55ef4b"
}

const powerbi = new service.Service(factories.hpmFactory, factories.wpmpFactory, factories.routerFactory);

let accessToken = "";
let embedUrl = "";
let reportContainer;
let reportRef;
let loading;


// interface AppProps { };
// interface AppState { accessToken: string; embedUrl: string; error: string[] };

class PowerBIApp extends React.Component {

    constructor(props) {
        super(props);

        this.state = { accessToken: "", embedUrl: "", error: [] };

        reportRef = React.createRef();

        // Report container
        loading = (
            <div style={{height:'300px'}}
                id="reportContainer"
                ref={reportRef} >
                Loading the report...
            </div>
        );
    }

    // React function
    render() {

        if (this.state.error.length) {

            // Cleaning the report container contents and rendering the error message in multiple lines
            reportContainer.textContent = "";
            this.state.error.forEach(line => {
                reportContainer.appendChild(document.createTextNode(line));
                reportContainer.appendChild(document.createElement("br"));
            });
        }
        else if (this.state.accessToken !== "" && this.state.embedUrl !== "") {

            const embedConfiguration = {
                type: "report",
                tokenType: models.TokenType.Aad,
                accessToken,
                embedUrl,
                id: config.reportId,
                /*
                // Enable this setting to remove gray shoulders from embedded report
                settings: {
                    background: models.BackgroundType.Transparent
                }
                */
            };

            const report = powerbi.embed(reportContainer, embedConfiguration);

            // Clear any other loaded handler events
            report.off("loaded");

            // Triggers when a content schema is successfully loaded
            report.on("loaded", function () {
                console.log("Report load successful");
            });

            // Clear any other rendered handler events
            report.off("rendered");

            // Triggers when a content is successfully embedded in UI
            report.on("rendered", function () {
                console.log("Report render successful");
            });

            // Clear any other error handler event
            report.off("error");

            // Below patch of code is for handling errors that occur during embedding
            report.on("error", function (event) {
                const errorMsg = event.detail;

                // Use errorMsg variable to log error in any destination of choice
                console.error(errorMsg);
            });
        }

        return loading;
    }

    // React function
    componentDidMount() {

        if (reportRef !== null) {
            reportContainer = reportRef["current"];
        }

        // User input - null check
        if (config.workspaceId === "" || config.reportId === "") {
            this.setState({ error: ["Please assign values to workspace Id and report Id in Config.ts file"] })
        } else {

            // Authenticate the user and generate the access token
            this.authenticate();
        }
    }

    // React function
    componentWillUnmount() {
        powerbi.reset(reportContainer);
    }

    // Authenticating to get the access token
    authenticate() {
        const thisObj = this;

        const msalConfig = {
            auth: {
                clientId: config.clientId
            }
        };

        const loginRequest = {
            scopes: config.scopes
        };

        const msalInstance = new UserAgentApplication(msalConfig);

        function successCallback(response) {
            if (response.tokenType === "id_token") {
                thisObj.authenticate();

            } else if (response.tokenType === "access_token") {

                accessToken = response.accessToken;
                thisObj.setUsername(response.account.name);

                // Refresh User Permissions
                thisObj.tryRefreshUserPermissions();
                thisObj.getembedUrl();

            } else {

                thisObj.setState({ error: [("Token type is: " + response.tokenType)] });
            }
        }

        function failCallBack(error) {
            thisObj.setState({ error: ["Redirect error: " + error] });
        }

        msalInstance.handleRedirectCallback(successCallback, failCallBack);

        // check if there is a cached user
        if (msalInstance.getAccount()) {

            // get access token silently from cached id-token
            msalInstance.acquireTokenSilent(loginRequest)
                .then((response) => {

                    // get access token from response: response.accessToken
                    accessToken = response.accessToken;
                    this.setUsername(response.account.name);
                    this.getembedUrl();
                })
                .catch((err) => {

                    // refresh access token silently from cached id-token
                    // makes the call to handleredirectcallback
                    if (err.name === "InteractionRequiredAuthError") {
                        msalInstance.acquireTokenRedirect(loginRequest);
                    }
                    else {
                        thisObj.setState({ error: [err.toString()] })
                    }
                });
        } else {

            // user is not logged in or cached, you will need to log them in to acquire a token
            msalInstance.loginRedirect(loginRequest);
        }
    }

    // Power BI REST API call to refresh User Permissions in Power BI
    // Refreshes user permissions and makes sure the user permissions are fully updated
    // https://docs.microsoft.com/rest/api/power-bi/users/refreshuserpermissions
    tryRefreshUserPermissions() {
        fetch("https://api.powerbi.com/v1.0/myorg/RefreshUserPermissions", {
            headers: {
                "Authorization": "Bearer " + accessToken
            },
            method: "POST"
        })
        .then(function (response) {
            if (response.ok) {
                console.log("User permissions refreshed successfully.");
            } else {
                // Too many requests in one hour will cause the API to fail
                if (response.status === 429) {
                    console.error("Permissions refresh will be available in up to an hour.");
                } else {
                    console.error(response);
                }
            }
        })
        .catch(function (error) {
            console.error("Failure in making API call." + error);
        });
    }

    // Power BI REST API call to get the embed URL of the report
    getembedUrl() {
        const thisObj = this;

        fetch("https://api.powerbi.com/v1.0/myorg/groups/" + config.workspaceId + "/reports/" + config.reportId, {
            headers: {
                "Authorization": "Bearer " + accessToken
            },
            method: "GET"
        })
            .then(function (response) {
                const errorMessage = [];
                errorMessage.push("Error occurred while fetching the embed URL of the report")
                errorMessage.push("Request Id: " + response.headers.get("requestId"));

                response.json()
                    .then(function (body) {
                        // Successful response
                        if (response.ok) {
                            embedUrl = body["embedUrl"];
                            thisObj.setState({ accessToken: accessToken, embedUrl: embedUrl });
                        }
                        // If error message is available
                        else {
                            errorMessage.push("Error " + response.status + ": " + body.error.code);

                            thisObj.setState({ error: errorMessage });
                        }

                    })
                    .catch(function () {
                        errorMessage.push("Error " + response.status + ":  An error has occurred");

                        thisObj.setState({ error: errorMessage });
                    });
            })
            .catch(function (error) {

                // Error in making the API call
                thisObj.setState({ error: error });
            })
    }

    // Show username in the UI
    setUsername(username) {
        const welcome = document.getElementById("welcome");
        if (welcome !== null)
            welcome.innerText = "Welcome, " + username;
    }
}

export default PowerBIApp;