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
} from '@chakra-ui/react';

export const CheckoutCard = () => {
  const [checkoutMethod, setCheckoutMethod] = useState('1');

  return (
    <Card align='center'>
      <CardHeader>
        <Heading size='md'>Payment Method</Heading>
      </CardHeader>
      <RadioGroup onChange={setCheckoutMethod} value={checkoutMethod}>
        <Stack direction='column'>
          <Radio value='1'>
            <Image />
            <Text>ePay (Mobile money, Cards)</Text>
          </Radio>
          <Radio value='2'>
            <Image />
            <Text>2nd entry</Text>
          </Radio>
        </Stack>
      </RadioGroup>
    </Card>
  );
};
