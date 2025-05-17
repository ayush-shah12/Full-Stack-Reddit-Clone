# Reddit Clone
![image](https://github.com/user-attachments/assets/40f9dd26-ed02-4916-9edc-b02091673009)

![image](https://github.com/user-attachments/assets/5fe682fc-81e1-4c88-9d6d-e82b95a06730)

![image](https://github.com/user-attachments/assets/87582cb4-a377-4dcc-bdc8-f921d7a0848a)



## Instructions to setup and run project

### Prerequisites:

1. Please ensure the following tools are installed on your system:

- Node.js
- npm
- MongoDB

### Server Setup:

#### Note: Windows Users
- Skip the client, server, and database setup by running:
```sh
scripts\start
```


1. Clone repository:

- If using HTTPS:

```sh

git clone https://github.com/ayush-shah12/Full-Stack-Reddit-Clone.git
```

- If using SSH:

```sh
git clone git@github.com:sbu-ckane-f24-cse316-pa01org/project-ae_project.git
```

Next, in the terminal of the local repository type the following:

```sh
cd Full-Stack-Reddit-Clone/server
```

2. Install server dependencies:

```sh
npm install
```

3. In the separate terminal, start the MongoDB server if it is not runnning already.

```sh
mongod
```

4. Initialize the database with default admin account:

- Inside the `server` directory, run the following:

```sh
node init.js <email> <displayName> <password>
```

Replace `<email>`, `<displayName>`, and `<password>` with the credentials for the admin account you want to create. This step will set up the initial admin account and populate database with any required default data.

5. Start the server

```sh
node server.js
```

Server is running on http://localhost:8000

### Client Setup:

1. Navigate to the client directory in terminal:

```sh
cd ../client
```

2. Install client dependencies

```sh
npm install
```

3. Start the client development server

```sh
npm start
```

The application will open in your browser at http://localhost:3000/

### Testing Instructions.

1. Server Tests.
   Run the server test in `server` directory:

```sh
npm test
```

2. Client Test. Navigate to the `client` directory:

```sh
cd ../client
npm test
```

In the sections below, list and describe each contribution briefly.

## Team Member 1 Contribution

- Test Cases 1-5
- Test Cases 15-19
- init.js
- UML Design

## Team Member 2 Contribution

- Test Cases 5-14
- Jests Test 2, Test 3
- UML Design
- Documentation

