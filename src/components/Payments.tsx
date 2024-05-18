import React, { useCallback } from 'react';
import { useState } from 'react';
import {
  Container,
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
  VStack,
  Icon,
  HStack,
  Select,
  CardFooter,
} from '@chakra-ui/react';
import { FaMobileAlt } from 'react-icons/fa';
import { AiOutlineMobile } from 'react-icons/ai';
import { FaCreditCard } from 'react-icons/fa6';

export const PaymentComponent = () => {
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [amount] = useState<number>(1);
  const [txFee] = useState<number>(0.0);
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardName, setCardName] = useState<string>('');
  const [cardExpiryDate, setCardExpiryDate] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');

  const toast = useToast();

  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const clientSecret =
    'pbkdf2_sha256$390000$NZ8uAWmCEOJrz5NAGhnHxk$I4vweW50Q1IOEBKeUJryl9yFqnGlQPX//euZmXJGDFI=';
  const accountNumber = import.meta.env.VITE_ACCOUNT_NUMBER;
  const accountReference = import.meta.env.VITE_ACCOUNT_REFERENCE;
  const callbackUrl = import.meta.env.VITE_CALLBACK_URL;

  const toggleMpesa = () => {
    setShowCardDetails(false);
    retrieveToken();
  };

  const toggleCard = () => {
    setShowCardDetails(true);
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
      setIsLoading(true);

      const payload = {
        AccountNumber: accountNumber,
        NetworkCode: '63902',
        MobileNumber: phoneNumber,
        Narration: 'C2B payment transaction',
        AccountReference: accountReference, // Generate UUID Hex value as Reference
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

        const paymentResponseData = await paymentResponse.json();
        console.log(
          `Payment response data: ${JSON.stringify(paymentResponseData)}`,
        );

        if (!paymentResponse.ok) {
          toast({
            title: paymentResponseData.message,
            status: 'error',
            isClosable: true,
          });
          localStorage.removeItem('checkout-request-id');
          throw new Error('Failed to process payment!');
        } else {
          localStorage.setItem(
            'checkout-request-id',
            paymentResponseData.CheckoutRequestID,
          );
          toast({
            title: `${paymentResponseData.message} 🚀`,
            status: 'success',
            isClosable: true,
          });
        }

        setIsLoading(false);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [
      accountNumber,
      accountReference,
      amount,
      baseUrl,
      callbackUrl,
      phoneNumber,
      toast,
      txFee,
    ],
  );

  const handleCardPayment = useCallback(
    async (ev: React.FormEvent) => {
      ev.preventDefault();
      const token = localStorage.getItem('token');
      console.log(token);
      setIsLoading(true);

      const payload = {
        network_code: '62100',
        phone: '0703291347',
        account_number: accountNumber,
        currency: 'kes',
        amount: amount,
        description: 'payment',
        callback_url: callbackUrl,
      };

      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

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

        const cardPaymentResponseData = await cardPaymentResponse.json();
        console.log(
          `Card payment response data: ${JSON.stringify(cardPaymentResponseData)}`,
        );

        if (!cardPaymentResponse) {
          toast({
            title: cardPaymentResponseData.message,
            status: 'error',
            isClosable: true,
          });
          throw new Error('Failed to process card payment');
        } else {
          toast({
            title: `${cardPaymentResponseData.message}`,
            status: 'success',
            isClosable: true,
          });
        }

        localStorage.setItem('card_number', cardNumber);
        localStorage.setItem('card_name', cardName);
        localStorage.setItem('card_expiry_date', cardExpiryDate);
        localStorage.setItem('card_cvv', cardCvv);

        const url = cardPaymentResponseData.url;
        console.log(url);

        await delay(5000);

        const finalizeCardPaymentPayload = {
          url,
          cardNumber,
          cardName,
          cardExpiryDate,
          cardCvv,
        };

        const finalizeCardPaymentResponse = await fetch(
          `${baseUrl}/transactions/card-c2b-process/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(finalizeCardPaymentPayload),
          },
        );

        const finalizeCardPaymentResponseData =
          await finalizeCardPaymentResponse.json();
        console.log(
          `Finalize card payment response data: ${JSON.stringify(finalizeCardPaymentResponseData)}`,
        );

        if (!finalizeCardPaymentResponse.ok) {
          toast({
            title: finalizeCardPaymentResponseData.message,
            status: 'error',
            isClosable: true,
          });
          throw new Error('Failed to process payment');
        } else {
          toast({
            title: finalizeCardPaymentResponseData.message,
            status: 'success',
            isClosable: true,
          });
        }

        localStorage.removeItem('token');
        setIsLoading(false);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [
      accountNumber,
      amount,
      baseUrl,
      callbackUrl,
      cardNumber,
      cardName,
      cardExpiryDate,
      cardCvv,
      toast,
    ],
  );

  return (
    <Container
      justifyContent='center'
      alignContent='center'
      height='100vh'
      maxW='88vh'
    >
      <Card
        borderRadius={12}
        width='100%'
        maxWidth='1200px'
        height='68%'
        maxHeight='1200px'
        p={6}
        size='lg'
      >
        <Flex flexDirection='column' gap={4}>
          <Flex justifyContent='start' alignItems='start'>
            <Image
              src='/Eb.png'
              alt='eBiashara Logo'
              borderRadius={6}
              width='100px'
              height='60px'
              ml={10}
              mt={12}
            />
          </Flex>
          <HStack spacing={36}>
            <Text color='#e94e1c' fontWeight='bold' fontSize='lg' ml={10}>
              SELECT A PAYMENT METHOD
            </Text>
            {/* <Text fontSize='2xl' fontWeight='bold' align='center'>
            Total Amount : KES 1.00
          </Text> */}

            <HStack>
              <Select variant='outline' placeholder='Kenya' size='sm' w='15vh'>
                <option>Kenya</option>
              </Select>
              <Select
                variant='outline'
                placeholder='English'
                size='sm'
                w='15vh'
              >
                <option>English</option>
                <option>Portugais</option>
                <option>Francais</option>
                <option>Arabic</option>
              </Select>
            </HStack>
          </HStack>

          <hr
            style={{
              width: '88%',
              alignSelf: 'center',
              border: '1px solid black',
            }}
          />
          <Flex justifyContent='flex-start' alignItems='center' ml={8}>
            <VStack alignItems='flex-start'>
              <Flex
                justifyContent='center'
                alignItems='center'
                flexDirection='row'
                gap={2}
              >
                <Icon as={AiOutlineMobile} boxSize={6} />
                <Text textAlign='center' fontSize={18}>
                  Mobile Money
                </Text>
              </Flex>
              <Card w='58%' cursor='pointer' onClick={toggleMpesa}>
                <Flex justifyContent='center'>
                  <Image src='/mpesa.jpg' alt='MPESA Logo' height='8vh' width='10vh' />
                </Flex>
              </Card>
              <Box style={{ flexGrow: 3 }}></Box>
              <Flex
                onClick={toggleCard}
                justifyContent='center'
                alignItems='center'
                gap={3}
              >
                <Icon as={FaCreditCard} boxSize={5} />
                <Text textAlign='center' fontSize={18}>
                  Card
                </Text>
              </Flex>
              <Card w='58%' cursor='pointer' onClick={toggleCard}>
                <Flex w='30vh'>
                  <Image src='/visa.png' alt='VISA Logo' w='30%' />
                  <Image src='/mastercard.png' alt='Mastercard Logo' w='30%' />
                </Flex>
              </Card>
              <Box></Box>
            </VStack>

            <Box m='auto'>
              {!showCardDetails ? (
                <form onSubmit={handlePayment} style={{ width: '36vh' }}>
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
                      disabled={isLoading}
                      type='submit'
                      width='100%'
                      bg='#e94e1c'
                      _hover={{
                        bg: '#e94e1c',
                      }}
                    >
                      {isLoading ? (
                        <Spinner color='green.500' />
                      ) : (
                        <Text color='#FFF'>Pay Now</Text>
                      )}
                    </Button>
                  </React.Fragment>
                </form>
              ) : (
                <Box style={{ margin: 'auto' }}>
                  <Box m='auto'>
                    <form
                      onSubmit={handleCardPayment}
                      style={{ width: '36vh' }}
                    >
                      <React.Fragment>
                        <Input
                          type='number'
                          placeholder='Card Number'
                          value={cardNumber}
                          onChange={(ev) =>
                            setCardNumber(ev.currentTarget.value)
                          }
                          required
                          mb={3}
                          focusBorderColor='green.500'
                        />
                        <Input
                          type='text'
                          placeholder='Card Name'
                          value={cardName}
                          onChange={(ev) => setCardName(ev.currentTarget.value)}
                          required
                          mb={3}
                          focusBorderColor='green.500'
                        />
                        <Input
                          type='text'
                          placeholder='Card Expiry Date'
                          value={cardExpiryDate}
                          onChange={(ev) =>
                            setCardExpiryDate(ev.currentTarget.value)
                          }
                          required
                          mb={3}
                          focusBorderColor='green.500'
                        />
                        <Input
                          type='password'
                          placeholder='CVV'
                          value={cardCvv}
                          onChange={(ev) => setCardCvv(ev.currentTarget.value)}
                          required
                          mb={3}
                          focusBorderColor='green.500'
                        />
                        <Button
                          type='submit'
                          disabled={isLoading}
                          width='100%'
                          bg='#e94e1c'
                          _hover={{
                            bg: '#e94e1c',
                          }}
                        >
                          {isLoading ? (
                            <Spinner color='green.500' />
                          ) : (
                            <Text color='#FFF'>Pay Now</Text>
                          )}
                        </Button>
                      </React.Fragment>
                    </form>
                  </Box>
                </Box>
              )}
            </Box>
          </Flex>
        </Flex>
        <CardFooter margin='auto' mt={20}>
          <Flex justifyContent='center' alignItems='center'>
            <Text>&copy; Powered by</Text>
            <Image src='/logo.png' alt='eBiashara Logo' width='120px' />
          </Flex>
        </CardFooter>
      </Card>
    </Container>
  );
};
