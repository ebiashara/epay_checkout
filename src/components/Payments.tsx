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
  Center,
  Divider,
  CardHeader,
  CardBody,
} from '@chakra-ui/react';
import { AiOutlineMobile } from 'react-icons/ai';
import { FaCreditCard } from 'react-icons/fa6';

export const PaymentComponent = () => {
  const [isFormVisible, setIsFormVisible] = useState(false);
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
    setIsFormVisible(true);
    setShowCardDetails(false);
    retrieveToken();
    setIsLoading(true);
  };

  const toggleCard = () => {
    setIsFormVisible(true);
    setShowCardDetails(true);
    retrieveToken();
    setIsLoading(true);
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
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      localStorage.removeItem('token');
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
          throw new Error('Failed to process payment!');
        } else {
          localStorage.setItem(
            'checkout-id',
            paymentResponseData.CheckoutRequestID,
          );

          const checkout_id = localStorage.getItem('checkout-id');

          setTimeout(() => {
            const intervalId = setInterval(() => {
              fetch(`${baseUrl}/transactions/ecommerce-transaction-check/`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  checkout_id,
                }),
              })
                .then((response) => {
                  console.log('Response: ', response);
                  return response.json();
                })
                .then((pollTxStatusData) => {
                  console.log(pollTxStatusData);
                  if (!pollTxStatusData) {
                    throw new Error('Network response was not ok!');
                  }

                  if (pollTxStatusData.transaction_status === 0) {
                    toast({
                      title: 'Processing ...',
                      status: 'success',
                      isClosable: true,
                    });
                  } else if (pollTxStatusData.transaction_status === 1) {
                    toast({
                      title: pollTxStatusData.message,
                      status: 'success',
                      isClosable: true,
                    });
                    clearInterval(intervalId);
                    localStorage.removeItem('checkout-id');
                  }
                })
                .catch((err) => {
                  console.error('Error fetching transaction status: ', err);
                  clearInterval(intervalId);
                });
            }, 1000);
          }, 3000);

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

        if (!token) {
          toast({
            title: 'Invalid or expired token',
            status: 'error',
            isClosable: true
          })
        }

        if (!cardPaymentResponse.ok) {
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

        /**
         * 1. Consider URL
         * 2. Get intent id from URL
         */

        const path = url.split('/pay/')[1].split('/cspaToken')[0];

        const intentId = path;
        console.log(`IntentID: ${intentId}`);
        localStorage.setItem('intent-id', intentId);

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

        console.log(finalizeCardPaymentResponse);

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
        }

        const form = document.createElement('form');
        form.id = 'deviceDataCollectionForm';
        form.method = 'POST';
        form.action =
          finalizeCardPaymentResponseData.device_data_collection_url;
        form.style.display = 'none';
        form.target = 'collectionIframe';

        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'JWT';
        input.value = finalizeCardPaymentResponseData.access_token;
        input.id = 'cardinal_collection_form_input';
        form.appendChild(input);

        const iframe = document.createElement('iframe');
        iframe.name = 'collectionIframe';
        iframe.style.display = 'none';
        iframe.id = 'cardinal_collection_iframe';
        iframe.width = '10';
        iframe.height = '10';

        document.body.appendChild(form);
        document.body.appendChild(iframe);
        form.submit();
        console.log('Hello there 👋');
        console.log(form.action);
        console.log(input.value);

        window.addEventListener('message', (event) => {
          if (event.origin === 'https://centinelapistag.cardinalcommerce.com') {
            console.log('Little Pay: Device details collected successfully');
          }
        });

        const collectDeviceDetailsUrl = `https://pay.little.africa/pay/${intentId}/enroll`;

        console.log(collectDeviceDetailsUrl);

        const collectDeviceDetailsPayload = {
          deviceInformation: {
            httpBrowserColorDepth: 24,
            httpBrowserJavaEnabled: true,
            httpBrowserJavaScriptEnabled: true,
            httpBrowserLanguage: 'en-US',
            httpBrowserScreenHeight: 1080,
            httpBrowserScreenWidth: 1920,
            httpBrowserTimeDifference: -300,
          },
        };

        const collectDeviceDetailsResponse = await fetch(
          collectDeviceDetailsUrl,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(collectDeviceDetailsPayload),
          },
        );

        const collectDeviceDetailsResponseData =
          await collectDeviceDetailsResponse.json();
        console.log(
          'Device detail response data',
          collectDeviceDetailsResponseData,
        );

        const action = collectDeviceDetailsResponseData.data.action;
        const accessToken = collectDeviceDetailsResponseData.data.accessToken;
        const stepUpUrl = collectDeviceDetailsResponseData.data.stepUpUrl;
        console.log('Step UP URL: ', stepUpUrl);
        console.log(action);

        if (action === 'MAKE_PAYMENT') {
          const processPaymentResponse = await fetch(
            `https://pay.little.africa/pay/${intentId}/process`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ type: 'CARDS' }),
            },
          );

          console.log(processPaymentResponse);

          const processPaymentResponseData =
            await processPaymentResponse.json();
          console.log('Process payment data: ', processPaymentResponseData);

          if (processPaymentResponse.ok) {
            toast({
              title: processPaymentResponseData.data.message,
              status: 'success',
              isClosable: true,
            });
          } else {
            toast({
              title: processPaymentResponseData.data.message,
              status: 'error',
              isClosable: true,
            });
          }
        } else if (action === 'AUTHENTICATE') {
          const form = document.createElement('form');
          form.id = 'stepUpForm';
          form.method = 'POST';
          form.action = stepUpUrl;
          form.target = '_blank';

          const jwtInput = document.createElement('input');
          jwtInput.type = 'hidden';
          jwtInput.name = 'JWT';
          jwtInput.value = accessToken;
          form.appendChild(jwtInput);

          const mdInput = document.createElement('input');
          mdInput.type = 'hidden';
          mdInput.name = 'MD';
          mdInput.value = intentId; //This is important. It is the reference received in the first step. It will be used to process the payment
          form.appendChild(mdInput);

          document.body.appendChild(form);

          form.submit();
        } else {
          toast({
            title: 'Payment Failed!',
            status: 'error',
            isClosable: true,
          });
        }

        localStorage.clear();
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
      height='110vh'
      maxW='88vh'
    >
      <Card
        justifyContent='center'
        alignContent='center'
        borderRadius={12}
        width='120vh'
        maxWidth='1200px'
        height='68%'
        maxHeight='1200px'
        p={6}
        size='lg'
      >
        <Flex flexDirection='row' gap={2}>
          <Flex flexDirection='column' gap={4} flexGrow={1}>
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
              <HStack>
                <Select
                  variant='outline'
                  placeholder='Kenya'
                  size='sm'
                  w='15vh'
                >
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

            <Divider
              style={{
                alignSelf: 'center',
                border: '1px solid gray',
                width: '84vh',
              }}
            />

            <Flex justifyContent='flex-start' alignItems='center' ml={8}>
              <VStack alignItems='flex-start'>
                <Flex
                  justifyContent='center'
                  alignItems='center'
                  flexDirection='row'
                  gap={2}
                  onClick={toggleMpesa}
                >
                  <Icon as={AiOutlineMobile} boxSize={6} />
                  <Text textAlign='center' fontSize={18}>
                    Mobile Money
                  </Text>
                </Flex>
                <Card w='58%' cursor='pointer' onClick={toggleMpesa}>
                  <Flex justifyContent='center'>
                    <Image
                      src='/mpesa.jpg'
                      alt='MPESA Logo'
                      height='8vh'
                      width='10vh'
                    />
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
                    <Image
                      src='/mastercard.png'
                      alt='Mastercard Logo'
                      w='30%'
                    />
                  </Flex>
                </Card>
                <Box></Box>
              </VStack>

              {isFormVisible ? (
                <Box m='auto'>
                  {!showCardDetails ? (
                    <form onSubmit={handlePayment} style={{ width: '36vh' }}>
                      {isLoading ? (
                        <Spinner color='green.500' size='lg' />
                      ) : (
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
                      )}
                    </form>
                  ) : (
                    <Box style={{ margin: 'auto' }}>
                      <Box m='auto'>
                        <form
                          onSubmit={handleCardPayment}
                          style={{ width: '36vh' }}
                        >
                          {isLoading ? (
                            <Spinner color='green.500' size='lg' />
                          ) : (
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
                                onChange={(ev) =>
                                  setCardName(ev.currentTarget.value)
                                }
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
                                onChange={(ev) =>
                                  setCardCvv(ev.currentTarget.value)
                                }
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
                          )}
                        </form>
                      </Box>
                    </Box>
                  )}
                </Box>
              ) : (
                <></>
              )}
            </Flex>
          </Flex>

          <Center mr={6} height='80%'>
            <Divider variant='solid' orientation='vertical' />
          </Center>

          <VStack spacing='45px' justifyContent='center'>
            <Card
              w='100%'
              h='12%'
              bg='green.500'
              justifyContent='center'
              alignItems='self-start'
              borderRadius={16}
            >
              <Flex flexDirection='column' pl={5}>
                <Text fontWeight='bold' textAlign='right'>
                  Balance Due
                </Text>
                <Text fontWeight='bold'>KES 1</Text>
              </Flex>
            </Card>
            <Card w='100%' h='20%' justifyContent='center' borderRadius={16}>
              <CardHeader bg='green.500'>
                <HStack spacing='36px'>
                  <Text fontWeight='bold'>Amount paid</Text>
                  <Text fontWeight='bold'>KES 0.00</Text>
                </HStack>
              </CardHeader>
              <Divider style={{ width: '100%', marginRight: '16px' }} />
              <CardBody bg='green.500'>
                <HStack spacing='36px'>
                  <Text color='gray.900'>Total Payable</Text>
                  <Text>KES 1</Text>
                </HStack>
              </CardBody>
            </Card>
            <Card
              w='28vh'
              h='18%'
              bg='green.500'
              justifyContent='center'
              borderRadius={16}
            >
              <Flex flexDirection='column' pl={5}>
                <Text color='gray.900'>Payment to</Text>
                <Text fontWeight='bold'>Hotpoint Appliances Limited</Text>
              </Flex>
            </Card>
          </VStack>
        </Flex>
        {/* <Flex flexDirection='row'> */}
        {/* </Flex> */}
        <CardFooter margin='auto' mt={20}>
          <HStack>
            <Text>&copy; Powered by</Text>
            <Image src='/logo.png' alt='eBiashara Logo' width='120px' />
          </HStack>
        </CardFooter>
      </Card>
    </Container>
  );
};
