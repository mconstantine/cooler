import { gql } from '@apollo/client'

export const userFragment = gql`
  fragment User on User {
    id
    name
    email
    password
    created_at
    updated_at
  }
`

export const tokenFragment = gql`
  fragment TokenResponse on TokenResponse {
    accessToken
    refreshToken
    expiration
  }
`

export const clientFragment = gql`
  ${userFragment}

  fragment Client on Client {
    id
    type
    name
    fiscal_code
    first_name
    last_name
    country_code
    vat_number
    business_name
    address_country
    address_province
    address_city
    address_zip
    address_street
    address_street_number
    address_email
    created_at
    updated_at
    user {
      ...User
    }
  }
`
