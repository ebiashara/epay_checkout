import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  Text,
  Heading,
  Radio,
  RadioGroup,
  Stack,
  Image,
  Center,
  Flex,
  Button,
} from '@chakra-ui/react';

export const CheckoutCard = () => {
  const [checkoutMethod, setCheckoutMethod] = useState('1');

  return (
    <Center>
      <Card
        justifyContent='center'
        alignItems='center'
        height='50vh'
        width='80vh'
        top='160px'
      >
        <Stack>
          <CardHeader>
            <Heading size='xl' justifyContent='start'>
              Payment Method
            </Heading>
          </CardHeader>
          <RadioGroup onChange={setCheckoutMethod} value={checkoutMethod}>
            <Stack direction='column' gap={6}>
              <Radio value='1' colorScheme='orange'>
                <Center>
                  <Image src='/logo.png' boxSize='120px' />
                  <Text fontSize='xl'>ePay (Mobile money, Cards)</Text>
                </Center>
              </Radio>
              <Radio value='2' colorScheme='orange'>
                <Center>
                  <Image src='/logo.png' boxSize='120px' />
                  <Text fontSize='xl'>2nd entry</Text>
                </Center>
              </Radio>
            </Stack>
          </RadioGroup>
        </Stack>
        <Flex justifyContent='flex-end' width='100%' marginTop='auto'>
          <Flex flexDirection='column' alignItems='flex-end'>
            <Text fontSize='lg' fontWeight='bold'>
              Checkout
            </Text>
            <Button width='40vh'>Pay with ePay</Button>
          </Flex>
        </Flex>
      </Card>
    </Center>
  );
};
