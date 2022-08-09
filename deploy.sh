set -a
source .env
set +a

scp -r ./build $SSH_URI:$SERVER_URI
ssh $SSH_URI "cd $SERVER_URI/build; ./install.sh"
ssh $SSH_URI "rm -rf $SERVER_URI/build"
