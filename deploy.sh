set -a
source .env
set +a

echo "[$APP_NAME]: Copying files to server..."

scp -r ./build $SSH_URI:$SERVER_URI

echo "[$APP_NAME]: Installing..."

ssh $SSH_URI "cd $SERVER_URI/build; ./install.sh"

echo "[$APP_NAME]: Cleaning up..."

ssh $SSH_URI "rm -rf $SERVER_URI/build"
