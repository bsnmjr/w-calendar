import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import Loader from '../components/loader';
import cookieHandle from '../lib/cookie';
import apiHandle from '../lib/api';
import cryptoHandle from '../lib/crypto';

const SECONDS_IN_A_HOUR = 60 * 60;

const Register = () => {

  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [isSendToken, setIsSendToken] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [userPhoneNumber, setPhoneNumber] = useState('');
  const [userAuthToken, setAuthToken] = useState('');
  const [userID, setID] = useState('');
  const [userPW, setPW] = useState('');
  const [userPW_re, setPW_re] = useState('');
  const [userName, setName] = useState('');

  useEffect(() => {
    async function getSessionId() {
      try {
        const response = await apiHandle('POST', '/register/getSessionId');
        if (response.isError) {
          toast.error(response.message, { autoClose: 1500 });
        } else {
          cookieHandle.set('sessionId', response.data.sessionId, { path: '/', maxAge: SECONDS_IN_A_HOUR });
          cookieHandle.set('NET_SessionId', response.data.NET_SessionId, { path: '/', maxAge: SECONDS_IN_A_HOUR });
        }
      } catch (err) {
        toast.error('서버와의 연결이 끊어졌습니다.', { autoClose: 1500 });
      }
    }
    getSessionId();
  }, [])

  async function onClickSendToken() {
    try {
      const response = await apiHandle('POST', '/register/sendToken', {
        phoneNumber: userPhoneNumber,
        NET_SessionId: cookieHandle.get('NET_SessionId')
      });
      if (response.isError) { toast.error(response.message, { autoClose: 1500 }); }
      else { setIsSendToken(true); toast.success(response.message, { autoClose: 1500 }); }
    } catch (err) {
      toast.error('서버와의 연결이 끊어졌습니다.', { autoClose: 1500 });
    }
  }

  async function onClickVerifyToken() {
    try {
      const response = await apiHandle('POST', '/register/verify', {
        phoneNumber: userPhoneNumber,
        authToken: userAuthToken,
        NET_SessionId: cookieHandle.get('NET_SessionId')
      });
      console.log(response)
      if (response.isError) { setIsSendToken(false); toast.error(response.message, { autoClose: 1500 }); }
      else { setIsAuth(true); toast.success(response.message, { autoClose: 1500 }); }
    } catch (err) {
      toast.error('서버와의 연결이 끊어졌습니다.', { autoClose: 1500 });
    }
  }

  async function onClickRegister() {
    const hasUpperCaseOfPW = /[A-Z]/.test(userPW);
    const hasLowerCaseOfPW = /[a-z]/.test(userPW);
    const hasNumbersOfPW = /\d/.test(userPW);
    const hasNonalphasOfPW = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi.test(userPW);
    const lengthOfPWThen8 = userPW.length > 8;

    if (!userID || !userPW || !userPW_re || !userName)
      toast.error('입력하지 않은 값들이 있습니다.', { autoClose: 1500 });
    else if (!hasUpperCaseOfPW)
      toast.error('비밀번호는 대문자를 포함해야 합니다.', { autoClose: 1500 });
    else if (!hasLowerCaseOfPW)
      toast.error('비밀번호는 소문자를 포함해야 합니다.', { autoClose: 1500 });
    else if (!hasNumbersOfPW)
      toast.error('비밀번호는 숫자를 포함해야 합니다.', { autoClose: 1500 });
    else if (!hasNonalphasOfPW)
      toast.error('비밀번호는 특수문자를 포함해야 합니다.', { autoClose: 1500 });
    else if (!lengthOfPWThen8)
      toast.error('비밀번호는 8자 이상이여야 합니다.', { autoClose: 1500 });
    else if (userPW != userPW_re) {
      toast.error('비밀번호가 서로 맞지 않습니다.', { autoClose: 1500 });
    } else {
      try {
        const response = await apiHandle('POST', '/register/final', {
          userID: cryptoHandle.AES_ENC(userID),
          userPW: cryptoHandle.AES_ENC(userPW),
          userName: cryptoHandle.AES_ENC(userName),
          phoneNumber: cryptoHandle.AES_ENC(userPhoneNumber),
          sessionId: cookieHandle.get('sessionId'),
          NET_SessionId: cookieHandle.get('NET_SessionId')
        });
        const loadData = response.data;
        if (loadData.isError) {
          toast.error(loadData.message, { autoClose: 1500 });
        } else {
          setLoading(true);
          toast.success(loadData.message, { autoClose: 1500 });
          setTimeout(() => {
            cookieHandle.remove('sessionId');
            cookieHandle.remove('NET_SessionId');
            setLoading(false);
            router.push('/login');
          }, 1500);
        }
      } catch (err) {
        console.log(err)
        toast.error('서버와의 연결이 끊겼습니다.', { autoClose: 1500 });
      }
    }
  }

  return (
    <>
      <Head>
        <title>단대라이브러리 : 회원가입</title>
        <meta property='og:title' content='단대라이브러리 : 회원가입' />
        <meta property='og:description' content='Click This.' />
        <meta property='og:type' content='website' />
        <meta property='og:url' content='https://ddlib.vercel.app/' />
        <meta property='og:image' content='/img/woongdo.png' />
      </Head>
      <ToastContainer />
      {
        loading ? <Loader />
          :
          <div className='min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
            <div className='max-w-md w-full space-y-8'>
              <div>
                <h2 className='font-black mt-6 text-4xl'>
                  회원가입하기
                </h2>
              </div>
              <form className='mt-8 space-y-6'>
                <div className='inputForm'>
                  {!isAuth &&
                    <>
                      <input
                        name='userPhoneNumber'
                        type='text'
                        required
                        className='relative block w-full px-3 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 text-sm'
                        placeholder='전화번호를 입력하세요.'
                        minLength='5'
                        maxLength='30'
                        autoComplete='off'
                        value={userPhoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value)
                        }}
                      />
                      {isSendToken &&
                        <>
                          <input
                            name='userAuthToken'
                            type='text'
                            required
                            className='relative block w-full px-3 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 text-sm'
                            placeholder='인증번호를 입력하세요.'
                            minLength='5'
                            maxLength='30'
                            autoComplete='off'
                            value={userAuthToken}
                            onChange={(e) => {
                              setAuthToken(e.target.value)
                            }}
                          />
                        </>
                      }
                    </>
                  }
                  {isAuth &&
                    <>
                      <input
                        name='userID'
                        type='text'
                        required
                        className='relative block w-full px-3 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 text-sm'
                        placeholder='아이디를 입력하세요.'
                        minLength='5'
                        maxLength='30'
                        autoComplete='off'
                        value={userID}
                        onChange={(e) => {
                          setID(e.target.value)
                        }}
                      />
                      <input
                        name='userPW'
                        type='password'
                        required
                        className='relative block w-full px-3 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 text-sm'
                        placeholder='비밀번호를 입력하세요.'
                        minLength='8'
                        autoComplete='off'
                        value={userPW}
                        onChange={(e) => {
                          setPW(e.target.value)
                        }}
                      />
                      <input
                        name='userPW_re'
                        type='password'
                        required
                        className='relative block w-full px-3 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 text-sm'
                        placeholder='비밀번호를 다시 입력하세요.'
                        minLength='8'
                        autoComplete='off'
                        value={userPW_re}
                        onChange={(e) => {
                          setPW_re(e.target.value)
                        }}
                      />
                      <input
                        name='userName'
                        type='text'
                        required
                        className='relative block w-full px-3 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 text-sm'
                        placeholder='이름을 입력하세요.'
                        minLength='1'
                        maxLength='10'
                        autoComplete='off'
                        value={userName}
                        onChange={(e) => {
                          setName(e.target.value)
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter')
                            onClickRegister();
                        }}
                      />
                    </>
                  }
                </div>
                <div className='text-sm pt-4'>
                  <p>
                    수집된 개인정보는 원활한 서비스 이용을 위한 목적으로 사용되오며,
                    일체 다른목적으로 사용되지 않습니다. 회원가입 시{' '}
                    <span>
                      <a
                        href='https://diagnostic-fender-8b3.notion.site/34d7e795c317475a8aed82c73e63c2e7'
                        className='font-semibold hover:text-gray-500'
                      >
                        개인정보처리방침
                      </a>
                    </span>{' '}
                    및{' '}
                    <span>
                      <a
                        href='https://diagnostic-fender-8b3.notion.site/cb20a978c0a74c0ab25aba0af413c5a0'
                        className='font-semibold hover:text-gray-500'
                      >
                        서비스 이용약관
                      </a>
                    </span>
                    에 동의하게 됩니다.
                  </p>
                </div>
                <div className='pt-5'>
                  {!isSendToken &&
                    <>
                      <button
                        onClick={onClickSendToken}
                        type='button'
                        className='relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                      >
                        인증번호 보내기
                      </button>
                    </>
                  }
                  {!isAuth && isSendToken &&
                    <>
                      <button
                        onClick={onClickVerifyToken}
                        type='button'
                        className='relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                      >
                        인증번호 확인하기
                      </button>
                    </>
                  }
                  {isAuth &&
                    <>
                      <button
                        onClick={onClickRegister}
                        type='button'
                        className='relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                      >
                        회원가입
                      </button>
                    </>
                  }
                </div>
              </form>
            </div>
          </div>
      }
    </>
  );
};

export default Register;
