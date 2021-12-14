import React from "react";
import Navbar from "react-bootstrap/Navbar";
import { useIsAuthenticated } from "@azure/msal-react";
import { SignInButton } from "./SignInButton";
import { SignOutButton } from "./SignOutButton";

/**
 * Renders the navbar component with a sign-in button if a user is not authenticated
 */
export const PageLayout = (props) => {
    const isAuthenticated = useIsAuthenticated();

    return (
        <div>
            <Navbar >
                <div style={{width:" 100%", padding:"25px"}}>
                <div style={{width:" 15%",textAlign:" right", paddingRight:'10px', float:'left'}}><img width='100%' src='http://cibuscellai.azurewebsites.net/static/media/cibuscell-logo.c9036873.png'></img></div>
                { isAuthenticated ? <div style={{width:" 85%",textAlign:" right", paddingRight:'10px', float:'left'}}><SignOutButton /></div> : <div  style={{width:" 85%",textAlign:" right", paddingRight:'10px', float:'left'}}><SignInButton /></div> }
                    </div>
                
            </Navbar>
            {props.children}
        </div>
    );
};