import React, { useState } from "react";
import { PageLayout } from "./components/PageLayout";
import "./App.css";

import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
  useMsal,
} from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import Button from "react-bootstrap/Button";
import { ProfileData } from "./components/ProfileData";
import { callMsGraph } from "./graph";
import _, { findIndex } from "lodash";
import PowerBIApp from "./PowerBI";

import { PowerBIEmbed } from "powerbi-client-react";
import { models } from "powerbi-client";
let access1 = null;
function App() {
  return (
    <PageLayout>
      <AuthenticatedTemplate>
        <ProfileContent />
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <p style={{color:'#e22b2b', paddingLeft:'10px', fontWeight:'600', textAlign:'center'}}>You are not signed in! Please sign in.</p>
      </UnauthenticatedTemplate>
    </PageLayout>
  );
}

function ProfileContent() {
  const { instance, accounts } = useMsal();
  const [graphData, setGraphData] = useState(null);
  const name = accounts[0] && accounts[0].name;
  const role = accounts[0] && accounts[0].idTokenClaims.roles;
  const [accessTokens, setAccessToken] = useState(null);
  const [graphURL, setGraphURL] = useState(null);
  const [roles, setRoles] = useState(null);
  const [openPowerBI, setOpenPowerBI] = useState(false);
  function RequestProfileData() {
    setRoles(accounts[0].idTokenClaims.roles);
    console.log(_.indexOf(role, "Admin.Read"));
    setGraphURL(
      "https://app.powerbi.com/reportEmbed?reportId=84d4de70-8501-4451-9acc-29b4c6317e12&autoAuth=true&ctid=0aa9d4d1-555d-4c5b-9589-7a3d72362c30&config=eyJjbHVzdGVyVXJsIjoiaHR0cHM6Ly93YWJpLWdlcm1hbnktd2VzdC1jZW50cmFsLXByaW1hcnktcmVkaXJlY3QuYW5hbHlzaXMud2luZG93cy5uZXQvIn0%3D"
    );
    const request = {
      ...loginRequest,
      account: accounts[0],
    };

    // Silently acquires an access token which is then attached to a request for Microsoft Graph data
    instance
      .acquireTokenSilent(request)
      .then((response) => {
        setAccessToken(response.accessToken);
        callMsGraph(response.accessToken).then((response) => {
          setGraphData(response);
        });
      })
      .catch((e) => {
        instance.acquireTokenPopup(request).then((response) => {
          callMsGraph(response.accessToken).then((response) =>
            setGraphData(response)
          );
        });
      });

    const PowerBIScopes = {
      scopes: [
        "https://analysis.windows.net/powerbi/api/Workspace.ReadWrite.All",
      ],
      account: accounts[0],
    };
    instance
      .acquireTokenSilent(PowerBIScopes)
      .then((tokenResponse) => {
        setAccessToken(tokenResponse.accessToken);
        access1 = tokenResponse.accessToken;
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  function openPowerBIComponent(){
    setOpenPowerBI(!openPowerBI);
  }

  return (
    <>
      <p style={{textAlign:'center', fontFamily:'serif', color:'#ffbc00', fontWeight:'600', fontSize:'20pt'}} className="card-title">Welcome {name}</p>
     
      <Button style={{backgroundColor:'rgb(2 107 181)', borderColor:'#86d1f5'}} onClick={() => openPowerBIComponent()}>{openPowerBI?'Close PowerBI':'Open PowerBI'}</Button>
      {openPowerBI&&<PowerBIApp></PowerBIApp>}
      {graphData ? (<>
         {_.indexOf(role, "Admin.Read") > -1 && <h5>You Are An Admin</h5>}
         {_.indexOf(role, "Admin.Read") == -1 && <h5>You Are A Customer</h5>}
        <ProfileData graphData={graphData} />
      </>) : (
        <><br/><Button style={{backgroundColor:'rgb(2 107 181)', borderColor:'#86d1f5'}} variant="secondary" onClick={RequestProfileData}>
          Request Profile Information
        </Button></>
      )}
    </>
  );
}
export default App;
