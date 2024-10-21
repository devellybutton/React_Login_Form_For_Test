# React 로그인 폼

<div align="center">

![화면 캡처 2024-10-21 205504](https://github.com/user-attachments/assets/b460055e-25f3-4eb6-a4de-c21cf50ed2d3)

</div>

## 🔥 개요

### 🔷 목적

- 본 프로젝트의 로그인 및 로그아웃 기능 구현 로직을 검증하기 위해 간단한 데모용 로그인 폼을 구현하였음.

### 🔷 설명

#### 자동 로그인 
- 사용자가 별도의 조작 없이, <b>`페이지 로딩과 동시에 자동으로 로그인 되어 있는 상태`</b>를 의미함.
- 입력폼 자체가 노출되지 않고, 로그인 페이지 클릭시 메인페이지로 리다이렉션됨.

#### 환경 설정

| <div align="center">구분</div>              | <div align="center">로컬</div>          | <div align="center">배포</div>          |
|-----------------------------------|---------------|---------------|
| <div align="center">일반 로그인<br>세션 및 쿠키 유효 기간</div> | <div align="center">24시간</div> | <div align="center">2시간</div> |
| <div align="center">자동 로그인<br>세션 및 쿠키 유효 기간</div> | <div align="center">2주</div> | <div align="center">2주</div> |
| <div align="center">세션 연장 알림</div>    | <div align="center">로그인 5초 후</div> | <div align="center">세션 만료 30분 전 <br>(로그인 1시간 30분 후)</div> |

#### UI 구현 내용

- <b>`현재 진행 상태`</b> : 로그인, 로그아웃, 세션 연장 등의 상태를 시각적으로 표시함.
- <b>`비밀번호 입력 UI`</b> : React MUI를 사용하여 비밀번호 입력 필드를 기본적으로 숨겨지게 설정하고, 눈 모양 아이콘 클릭 시 입력 유형을 text로 변경하여 비밀번호를 표시하는 조건부 렌더링을 구현하였음.

<details>
<summary><i> [시연 GIF] 비밀번호 입력 UI 조건부 렌더링 </i></summary>

![비밀번호UI](https://github.com/user-attachments/assets/833f2e53-82a8-4d0a-b2ee-45238122504a)

</details>

---------

## 🔥 로그인 폼 기능 명세

> 🔷 로그인 <br>
> 🔷 자동 로그인 <br>
> 🔷 세션 만료 알림 <br>
> 🔷 세션 연장 <br>
> 🔷 로그아웃 <br>

| 기능               | 설명                                                                                                                                                           |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **로그인**         | • 사용자가 아이디와 비밀번호를 입력하고 로그인 버튼을 클릭하면, `POST auth/sign-in` 요청을 서버로 전송함.<br> • 서버는 입력 정보를 검증하고, 로그인에 성공하면 `connect.sid`라는 세션 ID를 담은 쿠키를 브라우저에 전달함.         |
| **자동 로그인**     | • 자동 로그인 체크박스를 선택한 상태에서 로그인하면, `POST auth/sign-in?autoLogin=true` 요청을 통해 서버에 자동 로그인 설정을 알림.<br> • 서버는 이 정보를 바탕으로 세션 유효 기간을 다르게 설정함.                         |
| **세션 만료 알림**  | • 로그인 성공 시 소켓 통신이 활성화되며, 5초 후에 세션 연장 알림이 화면에 표시됨.<br> • 배포 환경에서는 세션 만료 30분 전에 수신됨.                                                                  |
| **세션 연장**      | • 사용자가 세션 연장 버튼을 클릭하면, 세션의 유효 기간이 연장됨.                                                                                         |
| **로그아웃**       | • 사용자가 로그아웃하면, `POST auth/sign-out` 요청을 통해 브라우저의 `connect.sid` 세션 ID 쿠키가 삭제됨.                                                    |

<details>
<summary><i> [시연 GIF] 로그인 </i></summary>

![로그인성공](https://github.com/user-attachments/assets/78ebec66-5bde-4a19-8b9b-2c734ab6d571)

</details>
<details>
<summary><i> [시연 GIF] 자동 로그인 </i></summary>

![자동로그인](https://github.com/user-attachments/assets/7bcaac06-a43d-4c31-8fb8-1240157e9784)


</details>
<details>
<summary><i> [시연 GIF] 세션 연장 버튼 클릭하여 연장 </i></summary>

![세션연장](https://github.com/user-attachments/assets/f83f525a-1e79-4d79-8e31-e4affe2c3670)

</details>
<details>
<summary><i> [시연 GIF] 세션 연장 버튼 클릭하지 않아 만료 </i></summary>

![세션만료](https://github.com/user-attachments/assets/b4bc5dbd-58ea-45a9-922d-003bce73ab1c)

</details>
<details>
<summary><i> [시연 GIF] 로그아웃 </i></summary>

![로그아웃](https://github.com/user-attachments/assets/31594a8e-72ce-49c9-bf1a-031e39a1785b)

</details>

---------

## 🔥 시퀀스 다이어그램

