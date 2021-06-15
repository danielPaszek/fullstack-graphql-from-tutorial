import { ChakraProvider, ColorModeProvider } from "@chakra-ui/react";
import { AppProps } from "next/dist/next-server/lib/router/router";
import { createClient } from "urql";

import theme from "../theme";

//exchanges/updates -> caches results of queries(don't have to request server for the answer)

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider resetCSS theme={theme}>
      <ColorModeProvider
        options={{
          useSystemColorMode: true,
        }}
      >
        <Component {...pageProps} />
      </ColorModeProvider>
    </ChakraProvider>
  );
}

export default MyApp;
