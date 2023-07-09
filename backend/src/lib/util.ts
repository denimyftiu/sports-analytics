import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from "@aws-sdk/client-dynamodb";

export const clearItem = (item: any) => {
    delete item['PK']
    delete item['SK']
    delete item['GSI1PK']
    delete item['GSI1SK']
    return item;
}

export const unmarshallList = (list: Record<string, AttributeValue>[]) =>  {
    return list.map(i => {
        return clearItem(unmarshall(i))
    })
}
