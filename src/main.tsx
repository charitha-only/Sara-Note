import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './style.css';
import './board.css';
import './readability.css';
window.EXCALIDRAW_ASSET_PATH=new URL('./excalidraw/',window.location.href.split('#')[0]).href;
class ErrorBoundary extends React.Component<{children:React.ReactNode},{error:string|null}> {
  state:{error:string|null}={error:null};
  static getDerivedStateFromError(error:Error){return {error:error.message};}
  render(){return this.state.error?<div className="fatal"><h1>Let’s get your notebook back.</h1><p>{this.state.error}</p><p>Your saved notes are on this computer.</p><button onClick={()=>location.reload()}>Reopen notebook</button></div>:this.props.children;}
}
createRoot(document.getElementById('root')!).render(<ErrorBoundary><App/></ErrorBoundary>);
