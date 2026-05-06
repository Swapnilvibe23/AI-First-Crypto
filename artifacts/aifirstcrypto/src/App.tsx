import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import { AlertChecker } from "@/components/alert-checker";

// Pages
import Home from "@/pages/home";
import Rates from "@/pages/rates";
import TopMovers from "@/pages/top-movers";
import FearGreed from "@/pages/fear-greed";
import CoinDetail from "@/pages/coin-detail";
import Resources from "@/pages/resources";
import Compare from "@/pages/compare";
import DCA from "@/pages/dca";
import Exchanges from "@/pages/exchanges";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import Disclaimer from "@/pages/disclaimer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchInterval: 60_000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/rates" component={Rates} />
        <Route path="/top-movers" component={TopMovers} />
        <Route path="/fear-greed" component={FearGreed} />
        <Route path="/coin/:id" component={CoinDetail} />
        <Route path="/compare" component={Compare} />
        <Route path="/dca" component={DCA} />
        <Route path="/resources" component={Resources} />
        <Route path="/exchanges" component={Exchanges} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/disclaimer" component={Disclaimer} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <AlertChecker />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
