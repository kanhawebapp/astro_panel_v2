import { gql } from "@apollo/client";

export const GET_OFFERS = gql`
  query GetOffers {
    getOffers {
      success
      message
      data {
        id
        offerName
        price
        description
        selected
        isActive
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_OFFER_STATUS = gql`
  mutation UpdateOfferStatus($offerId: String!, $isActive: Boolean!) {
    updateOfferStatus(offerId: $offerId, isActive: $isActive) {
      success
      message
    }
  }
`;

export const GET_REMEDIES = gql`
  query GetRemedies {
    getRemedies {
      success
      message
      data {
        id
        title
        description
        isActive
        createdAt
        updatedAt
      }
    }
  }
`;

export const SEND_REMEDY = gql`
  mutation SendRemedy($sessionId: String!, $remedyText: String!) {
    sendRemedy(sessionId: $sessionId, remedyText: $remedyText) {
      success
      message
    }
  }
`;

export const GET_SESSION_REMEDIES = gql`
  query GetSessionRemedies($filter: SessionRemedyFilterInput) {
    getSessionRemedies(filter: $filter) {
      success
      message
      totalCount
      currentPage
      totalPages
      data {
        id
        sessionId
        sessionType
        remedyText
        createdAt
      }
    }
  }
`;

export const GET_KUNDALI = gql`
  query GetKundali($requestSessionId: String!) {
    getKundali(requestSessionId: $requestSessionId) {
      status
      userId
      requestType
      requestSessionId
      userName
      data
    }
  }
`;

export const GET_ASTROLOGER_FOLLOWERS = gql`
  query GetAstrologerFollowers(
    $astrologerId: String!
    $page: Int!
    $limit: Int!
  ) {
    getAstrologerFollowers(
      astrologerId: $astrologerId
      page: $page
      limit: $limit
    ) {
      followers {
        id
        userId
        astrologerId
        createdAt

        user {
          id
          name
          mobile

          countryCode
        }
      }
      total
      page
      limit
      totalPages
    }
  }
`;

export const GET_ASTROLOGER_CALL_HISTORY = gql`
  query GetAstrologerCallHistory(
    $page: Int!
    $limit: Int!
    $status: SessionStatus
  ) {
    getAstrologerCallHistory(
      filter: { page: $page, limit: $limit, status: $status }
    ) {
      success
      totalCount
      currentPage
      totalPages

      data {
      userId
        sessionId
        roomId
        userName
        userMobile
        userCountryCode
        startedAt
        endedAt
        createdAt
        status
        durationSec
        durationMinutes
        ratePerMin
        coinsEarned
        commission
        lastMessage
        source
      }
    }
  }
`;

export const GET_ASTROLOGER_CHAT_HISTORY = gql`
  query GetAstrologerChatHistory(
    $page: Int!
    $limit: Int!
    $status: SessionStatus
  ) {
    getAstrologerChatHistory(
      filter: { page: $page, limit: $limit, status: $status }
    ) {
      success
      totalCount
      currentPage
      totalPages
      data {
      userId
        sessionId
        roomId
        userName
        birthPlace
        rating
        reviewComment
        status
        ratePerMin
        durationMinutes
        coinsEarned
        commission
        source
        createdAt
      }
    }
  }
`;

export const TOGGLE_ASTROLOGER_SERVICE = gql`
  mutation ToggleAstrologerService(
    $astrologerId: String!
    $serviceType: AstrologerServiceType!
    $status: Boolean!
  ) {
    toggleAstrologerService(
      astrologerId: $astrologerId
      serviceType: $serviceType
      status: $status
    ) {
      success
      message
    }
  }
`;

export const GET_ASTROLOGER_SERVICES = gql`
  query GetAstrologerServices($astrologerId: String!) {
    getAstrologerById(astrologerId: $astrologerId) {
      isChatActive
      isCallActive
      isLiveActive
      isPromotional
    }
  }
`;

export const GetAstrologerAnalytics = gql`
  query GetAstrologerAnalytics($astrologerId: String!) {
    getAstrologerAnalytics(astrologerId: $astrologerId) {
      totalEarnings
      totalFollowers
      totalChats
      totalCalls
      averageRating

      monthlyData {
        month
        earnings
        chats
        calls
      }
    }
  }
`;

export const GetAstrologerNotices = gql`
  query GetAstrologerNotices {
    getAstrologerNotices {
      id
      title
      description
      targetType
      isPinned
      isActive
      startDate
      endDate
      createdAt
    }
  }
`;
export const REFRESH_TOKEN = gql`
  mutation {
    refreshAstrologerToken {
      accessToken
    }
  }
`;

export const JOIN_LIVE = gql`
  query JoinLive($channelName: String!, $role: String!) {
    joinLive(channelName: $channelName, role: $role) {
      token
      uid
      appId
      channelName
    }
  }
`;

export const START_LIVE = gql`
  mutation StartLive($title: String!) {
    startLive(title: $title) {
      id
      astrologerId
      title
      channelName
      status
      createdAt
    }
  }
`;

export const END_LIVE = gql`
  mutation EndLive($streamId: String!) {
    endLive(streamId: $streamId)
  }
`;

export const SCHEDULE_LIVE = gql`
  mutation ScheduleLive($title: String!, $scheduledAt: String!) {
    scheduleLive(title: $title, scheduledAt: $scheduledAt) {
      id
      title
      channelName
      status
      scheduledAt
      createdAt
    }
  }
`;
export const GET_MY_SCHEDULED_LIVES = gql`
  query GetMyScheduledLives {
    getMyScheduledLives {
      id
      title
      channelName
      status
      scheduledAt
      createdAt
    }
  }
`;
