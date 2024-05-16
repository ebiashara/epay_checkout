import React, { useCallback } from 'react';
import { useState } from 'react';
import {
  Container,
  Heading,
  Box,
  Flex,
  Image,
  Input,
  Button,
  Card,
  Text,
  InputGroup,
  InputLeftAddon,
  useToast,
  Spinner,
} from '@chakra-ui/react';

export const PaymentComponent = () => {
  const [showMpesaDetails, setShowMpesaDetails] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [amount, setAmount] = useState<number>(1);
  const [txFee, setTxFee] = useState<number>(0.0);

  const toast = useToast();

  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const clientSecret =
    'pbkdf2_sha256$390000$43P68pHRD5iBux7wfg1JkV$b6Ry45SFHEswmJ8cNwqgDfMRKXoyJw8OPeoSxrehbZY=';
  const accountNumber = import.meta.env.VITE_ACCOUNT_NUMBER;
  const networkCode = import.meta.env.VITE_NETWORK_CODE;
  const accountReference = import.meta.env.VITE_ACCOUNT_REFERENCE;
  const callbackUrl = import.meta.env.VITE_CALLBACK_URL;

  const toggleMpesa = () => {
    setShowMpesaDetails(true);
    setShowCardDetails(false);
    retrieveToken();
  };

  const toggleCard = () => {
    setShowCardDetails(true);
    setShowMpesaDetails(false);
    retrieveToken();
  };

  const retrieveToken = async () => {
    try {
      const response = await fetch(`${baseUrl}/auth/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });
      setIsLoading(true);
      const data = await response.json();
      console.log('Response data: ', data);

      if (!response.ok) {
        toast({ title: `${data.detail}`, status: 'error', isClosable: true });
        throw new Error(data.detail || 'Failed to retrieve token!');
      }

      localStorage.setItem('token', data.access_token);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayment = useCallback(
    async (ev: React.FormEvent) => {
      ev.preventDefault();
      const token = localStorage.getItem('token');
      const payload = {
        AccountNumber: accountNumber,
        NetworkCode: networkCode,
        MobileNumber: phoneNumber,
        Narration: 'Pay for Gift',
        AccountReference: accountReference,
        CountryCode: '254',
        CurrencyCode: 'KES',
        Amount: amount,
        TransactionFee: txFee,
        CallBackUrl: callbackUrl,
      };

      try {
        const paymentResponse = await fetch(`${baseUrl}/transactions/c2b/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const paymentResponseData = paymentResponse.json();
        console.log(`Payment response data: ${paymentResponseData}`);

        if (!paymentResponse.ok) {
          setIsLoading(false);
          // toast({
          //   title: 'Error processing payment',
          //   status: 'error',
          //   isClosable: true,
          // });
          throw new Error(
            paymentResponseData.message || 'Failed to process payment!',
          );
        } else {
          toast({
            title: 'Payment successful! 🚀',
            status: 'error',
            isClosable: true,
          });
          console.log('Success!');
        }

        localStorage.removeItem('token');
      } catch (err) {
        console.error(err);
      }
    },
    [
      accountNumber,
      accountReference,
      amount,
      baseUrl,
      callbackUrl,
      networkCode,
      phoneNumber,
      toast,
      txFee,
    ],
  );

  const handleCardPayment = useCallback(async (ev: React.FormEvent) => {

    ev.preventDefault();
    const token = localStorage.getItem('token');

    const payload = {
      network_code: networkCode,
      phone: phoneNumber,
      account_number: accountNumber,
      currency: 'kes',
      amount: amount,
      description: 'payment',
      callback_url: callbackUrl
    };

    try {
      const cardPaymentResponse = await fetch(
        `${baseUrl}/transactions/card-c2b/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const cardPaymentResponseData = cardPaymentResponse.json()
      console.log(`Card payment response data: ${cardPaymentResponseData}`);

      if (!cardPaymentResponse) {
        throw new Error('Failed to process card payment');
      }

      localStorage.removeItem('token');
    } catch (err) {
      console.error(err);
    }
  },
  [accountNumber, amount, baseUrl, callbackUrl, networkCode, phoneNumber]
);

  const animatePaymentCard = () => {
    // Functionality for animating Card payment
  };

  const validateMpesaInput = () => {
    // Functionality for validating Mpesa input
  };

  const validateCardInput = () => {
    // Functionality for validating Card input
  };

  return (
    <Container justifyContent='center' alignContent='center' height='100vh'>
      <Heading color='#e94e1c' mb={6} textAlign='center'>
        Select Payment Method
      </Heading>
      <Card borderRadius={12} width='68vh'>
        <Flex flexDirection='column' gap={4}>
          <Box>
            <Image
              src='/Eb.png'
              alt='eBiashara Logo'
              borderRadius={6}
              width='100px'
              height='60px'
              ml={10}
              mt={12}
            />
          </Box>
          <Text fontSize='2xl' fontWeight='bold' align='center'>
            Total Amount : KES 1.00
          </Text>

          <hr
            style={{
              width: '85%',
              alignSelf: 'center',
              border: '1px solid black',
            }}
          />

          <Flex justifyContent='flex-start' alignItems='center' ml={8}>
            <Box>
              <Flex
                justifyContent='center'
                alignItems='center'
                flexDirection='column'
                gap={4}
              >
                <Box
                  onClick={toggleMpesa}
                  justifyContent='center'
                  alignItems='center'
                >
                  <Text textAlign='center'>Mpesa</Text>
                  <Image mt={3} src='/phone.png' alt='MPESA Logo' />
                </Box>
                <Box style={{ flexGrow: 3 }}></Box>
                <Box
                  onClick={toggleCard}
                  justifyContent='center'
                  alignItems='center'
                >
                  <Image src='/creditcard.png' alt='Visa Logo' mb={3} />
                  <Text textAlign='center'>Card</Text>
                </Box>
                <Box></Box>
              </Flex>
            </Box>

            {showMpesaDetails && (
              <Box m='auto'>
                <form onSubmit={handlePayment}>
                  {isLoading ? (
                    <React.Fragment>
                      <InputGroup>
                        <InputLeftAddon bg='gray.900' color='#FFF'>
                          +254
                        </InputLeftAddon>
                        <Input
                          type='text'
                          placeholder='7xxxxxxxx'
                          onChange={(ev) =>
                            setPhoneNumber(ev.currentTarget.value)
                          }
                          value={phoneNumber}
                          mb={3}
                          focusBorderColor='green.500'
                        />
                      </InputGroup>
                      <Button
                        type='submit'
                        disabled={isLoading}
                        width='100%'
                        bg='#e94e1c'
                        _hover={{
                          bg: '#e94e1c',
                        }}
                      >
                        {isLoading ? 'Pay Now' : <Spinner />}
                      </Button>
                    </React.Fragment>
                  ) : (
                    <Spinner />
                  )}
                </form>
              </Box>
            )}

            {showCardDetails && (
              <Box style={{ width: '70%', margin: 'auto' }}>
                <Box m='auto'>
                  <form onSubmit={handleCardPayment}>
                    {isLoading ? (
                      <React.Fragment>
                        <Input
                          type='password'
                          placeholder='Card Number'
                          onChange={(ev) => ev.currentTarget.value}
                          required
                          mb={3}
                          focusBorderColor='green.500'
                        />
                        <Input
                          type='text'
                          placeholder='Card Name'
                          onChange={(ev) => ev.currentTarget.value}
                          required
                          mb={3}
                          focusBorderColor='green.500'
                        />
                        <Input
                          type='text'
                          placeholder='Card Expiry Date'
                          onChange={(ev) => ev.currentTarget.value}
                          required
                          mb={3}
                          focusBorderColor='green.500'
                        />
                        <Input
                          type='password'
                          placeholder='CVV'
                          onChange={(ev) => ev.currentTarget.value}
                          required
                          mb={3}
                          focusBorderColor='green.500'
                        />
                        <Button
                          type='submit'
                          className='pay-button-card'
                          disabled
                          width='100%'
                          bg='#e94e1c'
                          _hover={{
                            bg: '#e94e1c',
                          }}
                        >
                          Pay Now
                        </Button>
                      </React.Fragment>
                    ) : (
                      <Spinner />
                    )}
                  </form>
                </Box>
              </Box>
            )}
          </Flex>

          <footer>
            <Flex justifyContent='center' alignItems='center'>
              <Text>&copy; Powered by</Text>
              <Image src='/logo.png' alt='eBiashara Logo' width='120px' />
            </Flex>
          </footer>
        </Flex>
      </Card>
    </Container>
  );
};
