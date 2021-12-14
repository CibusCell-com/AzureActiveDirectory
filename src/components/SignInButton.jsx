import React from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";
import Button from "react-bootstrap/Button";

function handleLogin(instance) {
    instance.loginPopup(loginRequest).then(loginResponse => {
        // console.log("id_token acquired at: " + new Date().toString());
        // console.log(loginResponse);
        // const AzureMgmtScops ={
        //     scopes:["https://analysis.windows.net/powerbi/api/Workspace.ReadWrite.All"],
        //     account: loginResponse.account
        // }
        // instance.acquireTokenSilent(AzureMgmtScops).then(tokenResponse => {
        //     // showAccesstoken(tokenResponse.accessToken)
        //     let accessToken = tokenResponse.accessToken;
        //     console.info("======the accesstoken is ======:"+tokenResponse.accessToken);
        //     // callMSGraph(apiConf.endpoint, tokenResponse.accessToken, showResult);
        // }).catch(function (error) {
        //      console.log(error);
        // })
        // getAzureAccessToken(instance);

        
    }).catch(error => {
        console.log(error);
    });
}

function getAzureAccessToken(instance){
    const AzureMgmtScops ={
        scopes:["https://analysis.windows.net/powerbi/api/Workspace.ReadWrite.All"]
    }
    // instance.acquireTokenSilent(AzureMgmtScops).then(tokenResponse => {
    //     // showAccesstoken(tokenResponse.accessToken)
    //     let accessToken = tokenResponse.accessToken;
    //     console.info("======the accesstoken is ======:"+tokenResponse.accessToken);
    //     // callMSGraph(apiConf.endpoint, tokenResponse.accessToken, showResult);
    // }).catch(function (error) {
    //      console.log(error);
    // })
}
/**
 * Renders a button which, when selected, will open a popup for login
 */
export const SignInButton = () => {
    const { instance } = useMsal();

    return (
        <Button style={{backgroundColor:'rgb(2 107 181)', borderColor:'#86d1f5'}} variant="secondary" className="ml-auto" onClick={() => handleLogin(instance)}>Sign in using Popup</Button>
    );
}