// ************** THIS IS YOUR APP'S ENTRY POINT. CHANGE THIS FILE AS NEEDED. **************
// ************** DEFINE YOUR REACT COMPONENTS in ./components directory **************
import { ViewContextProvider } from './context/ViewContext.jsx';
import Wrapper from './Wrapper.jsx';

function App() {

  return (
    <ViewContextProvider>
        <Wrapper/> 
    </ViewContextProvider>
  );
}

export default App;
